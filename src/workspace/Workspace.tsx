import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

type Project = {
  id: string;
  title: string;
  client_name: string | null;
  description: string | null;
  due_date: string | null;
  budget: number | null;
  source: "manual" | "craftly_contract";
  contract_id: string | null;
  created_at: string;

  client_id?: string | null;
  subclient_id?: string | null;
  status_id?: string | null;
  priority_id?: string | null;
  type_id?: string | null;

  workspace_clients?: {
    id: string;
    name: string;
  }[] | null;

  workspace_subclients?: {
    id: string;
    name: string;
  }[] | null;

  workspace_statuses?: {
    id: string;
    name: string;
    color: string | null;
  }[] | null;

  workspace_priorities?: {
    id: string;
    name: string;
    color: string | null;
  }[] | null;

  workspace_types?: {
    id: string;
    name: string;
    color: string | null;
  }[] | null;
};

type WorkspaceClient = {
  id: string;
  name: string;
};

type WorkspaceSubclient = {
  id: string;
  client_id: string;
  name: string;
};

type WorkspaceStatus = {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
};

type WorkspacePriority = {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
};

type WorkspaceType = {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
};

function ColorBadge({
  label,
  color,
}: {
  label: string;
  color: string | null;
}) {
  const safeColor = color || "#64748b";

  return (
    <span
      className="text-xs px-3 py-1 rounded-full border"
      style={{
        color: safeColor,
        borderColor: safeColor,
        backgroundColor: `${safeColor}18`,
      }}
    >
      {label}
    </span>
  );
}

export default function Workspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [expandedBoardCards, setExpandedBoardCards] = useState<
    Record<string, boolean>
  >({});

  const [clients, setClients] = useState<WorkspaceClient[]>([]);
  const [subclients, setSubclients] = useState<WorkspaceSubclient[]>([]);
  const [statuses, setStatuses] = useState<WorkspaceStatus[]>([]);
  const [priorities, setPriorities] = useState<WorkspacePriority[]>([]);
  const [types, setTypes] = useState<WorkspaceType[]>([]);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [subclientId, setSubclientId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editSubclientId, setEditSubclientId] = useState("");
  const [editTypeId, setEditTypeId] = useState("");
  const [editStatusId, setEditStatusId] = useState("");
  const [editPriorityId, setEditPriorityId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const premiumSelectClass =
    "mt-1 w-full appearance-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 pr-10 text-sm text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] transition placeholder:text-[var(--text-faint)] focus:border-[color:var(--accent-border)] focus:bg-[var(--surface-hover)] focus:ring-2 focus:ring-[color:var(--accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed";

  const darkInputClass =
    "mt-1 w-full appearance-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] transition placeholder:text-[var(--text-faint)] focus:border-[color:var(--accent-border)] focus:bg-[var(--surface-hover)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

  const darkTextareaClass =
    "mt-1 w-full appearance-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] transition placeholder:text-[var(--text-faint)] focus:border-[color:var(--accent-border)] focus:bg-[var(--surface-hover)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredSubclients = useMemo(() => {
    if (!clientId) return [];
    return subclients.filter((s) => s.client_id === clientId);
  }, [subclients, clientId]);

  const filteredEditSubclients = useMemo(() => {
    if (!editClientId) return [];
    return subclients.filter((s) => s.client_id === editClientId);
  }, [subclients, editClientId]);

  const boardColumns = useMemo(() => {
    const noStatusColumn = {
      id: "__no_status__",
      name: "No Status",
      color: "#64748b",
    };

    const dynamicColumns = statuses.map((status) => ({
      id: status.id,
      name: status.name,
      color: status.color,
    }));

    return [noStatusColumn, ...dynamicColumns].map((column) => ({
      ...column,
      projects: projects.filter((project) => {
        if (column.id === "__no_status__") return !project.status_id;
        return project.status_id === column.id;
      }),
    }));
  }, [projects, statuses]);

  async function getUserId() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  }

  async function loadAll() {
    setLoading(true);
    setMsg(null);

    const uid = await getUserId();

    if (!uid) {
      setMsg("Please log in.");
      setLoading(false);
      return;
    }

    const [
      projectsRes,
      clientsRes,
      subclientsRes,
      statusesRes,
      prioritiesRes,
      typesRes,
    ] = await Promise.all([
      supabase
        .from("projects")
        .select(`
          id,
          title,
          client_name,
          description,
          due_date,
          budget,
          source,
          contract_id,
          created_at,
          client_id,
          subclient_id,
          status_id,
          priority_id,
          type_id,
          workspace_clients:client_id ( id, name ),
          workspace_subclients:subclient_id ( id, name ),
          workspace_statuses:status_id ( id, name, color ),
          workspace_priorities:priority_id ( id, name, color ),
          workspace_types:type_id ( id, name, color )
        `)
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),

      supabase
        .from("workspace_clients")
        .select("id,name")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),

      supabase
        .from("workspace_subclients")
        .select("id,client_id,name")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),

      supabase
        .from("workspace_statuses")
        .select("id,name,color,sort_order")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true }),

      supabase
        .from("workspace_priorities")
        .select("id,name,color,sort_order")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true }),

      supabase
        .from("workspace_types")
        .select("id,name,color,sort_order")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true }),
    ]);

    if (projectsRes.error) setMsg(projectsRes.error.message);
    if (clientsRes.error) setMsg(clientsRes.error.message);
    if (subclientsRes.error) setMsg(subclientsRes.error.message);
    if (statusesRes.error) setMsg(statusesRes.error.message);
    if (prioritiesRes.error) setMsg(prioritiesRes.error.message);
    if (typesRes.error) setMsg(typesRes.error.message);

    setProjects((projectsRes.data ?? []) as Project[]);
    setClients((clientsRes.data ?? []) as WorkspaceClient[]);
    setSubclients((subclientsRes.data ?? []) as WorkspaceSubclient[]);
    setStatuses((statusesRes.data ?? []) as WorkspaceStatus[]);
    setPriorities((prioritiesRes.data ?? []) as WorkspacePriority[]);
    setTypes((typesRes.data ?? []) as WorkspaceType[]);

    setLoading(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uid = await getUserId();

    if (!uid) {
      setMsg("Please log in.");
      return;
    }

    if (!title.trim()) {
      setMsg("Project title is required.");
      return;
    }

    setSubmitting(true);

    const parsedBudget = budget.trim() === "" ? null : Number(budget);
    const selectedClient = clients.find((c) => c.id === clientId);

    const { error } = await supabase.from("projects").insert({
      user_id: uid,
      title: title.trim(),
      client_name: selectedClient?.name ?? null,
      client_id: clientId || null,
      subclient_id: subclientId || null,
      type_id: typeId || null,
      status_id: statusId || null,
      priority_id: priorityId || null,
      description: description.trim() || null,
      due_date: dueDate || null,
      budget: parsedBudget,
      source: "manual",
      contract_id: null,
    });

    setSubmitting(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setTitle("");
    setClientId("");
    setSubclientId("");
    setTypeId("");
    setStatusId("");
    setPriorityId("");
    setDescription("");
    setDueDate("");
    setBudget("");
    setMsg("Project created ✅");

    await loadAll();
  }

  function openEditModal(project: Project) {
    setEditingProjectId(project.id);
    setEditTitle(project.title ?? "");
    setEditClientId(project.client_id ?? "");
    setEditSubclientId(project.subclient_id ?? "");
    setEditTypeId(project.type_id ?? "");
    setEditStatusId(project.status_id ?? "");
    setEditPriorityId(project.priority_id ?? "");
    setEditDescription(project.description ?? "");
    setEditDueDate(project.due_date ?? "");
    setEditBudget(project.budget != null ? String(project.budget) : "");
    setMsg(null);
  }

  function closeEditModal() {
    setEditingProjectId(null);
    setEditTitle("");
    setEditClientId("");
    setEditSubclientId("");
    setEditTypeId("");
    setEditStatusId("");
    setEditPriorityId("");
    setEditDescription("");
    setEditDueDate("");
    setEditBudget("");
  }

  async function saveProjectEdits(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!editingProjectId) return;
    if (!editTitle.trim()) {
      setMsg("Project title is required.");
      return;
    }

    setEditSubmitting(true);

    const parsedBudget = editBudget.trim() === "" ? null : Number(editBudget);
    const selectedClient = clients.find((c) => c.id === editClientId);

    const { error } = await supabase
      .from("projects")
      .update({
        title: editTitle.trim(),
        client_name: selectedClient?.name ?? null,
        client_id: editClientId || null,
        subclient_id: editSubclientId || null,
        type_id: editTypeId || null,
        status_id: editStatusId || null,
        priority_id: editPriorityId || null,
        description: editDescription.trim() || null,
        due_date: editDueDate || null,
        budget: parsedBudget,
      })
      .eq("id", editingProjectId);

    setEditSubmitting(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Project updated ✅");
    closeEditModal();
    await loadAll();
  }

  async function updateStatus(id: string, nextStatusId: string) {
    const { error } = await supabase
      .from("projects")
      .update({ status_id: nextStatusId || null })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    const selectedStatus = statuses.find((s) => s.id === nextStatusId) ?? null;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status_id: nextStatusId || null,
              workspace_statuses: selectedStatus
                ? [
                    {
                      id: selectedStatus.id,
                      name: selectedStatus.name,
                      color: selectedStatus.color,
                    },
                  ]
                : null,
            }
          : p
      )
    );
  }

  async function updatePriority(id: string, nextPriorityId: string) {
    const { error } = await supabase
      .from("projects")
      .update({ priority_id: nextPriorityId || null })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    const selectedPriority =
      priorities.find((p) => p.id === nextPriorityId) ?? null;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              priority_id: nextPriorityId || null,
              workspace_priorities: selectedPriority
                ? [
                    {
                      id: selectedPriority.id,
                      name: selectedPriority.name,
                      color: selectedPriority.color,
                    },
                  ]
                : null,
            }
          : project
      )
    );
  }

  async function updateType(id: string, nextTypeId: string) {
    const { error } = await supabase
      .from("projects")
      .update({ type_id: nextTypeId || null })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    const selectedType = types.find((t) => t.id === nextTypeId) ?? null;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              type_id: nextTypeId || null,
              workspace_types: selectedType
                ? [
                    {
                      id: selectedType.id,
                      name: selectedType.name,
                      color: selectedType.color,
                    },
                  ]
                : null,
            }
          : project
      )
    );
  }

  async function updateClientAndSubclient(
    id: string,
    nextClientId: string,
    nextSubclientId: string
  ) {
    const selectedClient = clients.find((c) => c.id === nextClientId) ?? null;
    const selectedSubclient =
      subclients.find((s) => s.id === nextSubclientId) ?? null;

    const { error } = await supabase
      .from("projects")
      .update({
        client_id: nextClientId || null,
        client_name: selectedClient?.name ?? null,
        subclient_id: nextSubclientId || null,
      })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              client_id: nextClientId || null,
              client_name: selectedClient?.name ?? null,
              subclient_id: nextSubclientId || null,
              workspace_clients: selectedClient
                ? [
                    {
                      id: selectedClient.id,
                      name: selectedClient.name,
                    },
                  ]
                : null,
              workspace_subclients: selectedSubclient
                ? [
                    {
                      id: selectedSubclient.id,
                      name: selectedSubclient.name,
                    },
                  ]
                : null,
            }
          : project
      )
    );
  }

  async function updateDueDate(id: string, nextDueDate: string) {
    const { error } = await supabase
      .from("projects")
      .update({ due_date: nextDueDate || null })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              due_date: nextDueDate || null,
            }
          : project
      )
    );
  }

  async function updateBudget(id: string, nextBudget: string) {
    const parsedBudget = nextBudget.trim() === "" ? null : Number(nextBudget);

    if (nextBudget.trim() !== "" && Number.isNaN(parsedBudget)) {
      setMsg("Budget must be a valid number.");
      return;
    }

    const { error } = await supabase
      .from("projects")
      .update({ budget: parsedBudget })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              budget: parsedBudget,
            }
          : project
      )
    );
  }

  async function updateTitle(id: string, nextTitle: string) {
    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle) {
      setMsg("Project title cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("projects")
      .update({ title: trimmedTitle })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              title: trimmedTitle,
            }
          : project
      )
    );
  }

  async function updateDescription(id: string, nextDescription: string) {
    const normalizedDescription =
      nextDescription.trim() === "" ? null : nextDescription;

    const { error } = await supabase
      .from("projects")
      .update({ description: normalizedDescription })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              description: normalizedDescription,
            }
          : project
      )
    );
  }

  async function deleteProject(id: string) {
    const ok = window.confirm("Delete this project?");
    if (!ok) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleBoardCard(id: string) {
    setExpandedBoardCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function renderProjectCard(p: Project, compact = false) {
    const isBoardCollapsed = compact && !expandedBoardCards[p.id];

    return (
      <div
        key={p.id}
        className="rounded-2xl border border-[color:var(--border-soft)] p-4 md:p-5 backdrop-blur-lg shadow-[var(--card-shadow-soft)]"
        style={{ backgroundColor: "var(--surface-soft)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Title
                </label>

                {compact && (
                  <button
                    type="button"
                    onClick={() => toggleBoardCard(p.id)}
                    className="text-xs px-2 py-1 rounded-md border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-[var(--text-main)] opacity-80 hover:bg-[var(--surface-hover)]"
                  >
                    {isBoardCollapsed ? "Expand" : "Collapse"}
                  </button>
                )}
              </div>

              <input
                value={p.title}
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((project) =>
                      project.id === p.id
                        ? { ...project, title: e.target.value }
                        : project
                    )
                  )
                }
                onBlur={(e) => void updateTitle(p.id, e.target.value)}
                className="mt-1 w-full appearance-none rounded-lg border border-[color:var(--border-soft)] px-3 py-2 bg-[var(--surface-soft)] text-base font-semibold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                placeholder="Project title"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {p.workspace_statuses?.[0] && (
                <ColorBadge
                  label={p.workspace_statuses[0].name}
                  color={p.workspace_statuses[0].color}
                />
              )}

              {p.workspace_priorities?.[0] && (
                <ColorBadge
                  label={p.workspace_priorities[0].name}
                  color={p.workspace_priorities[0].color}
                />
              )}

              {p.workspace_types?.[0] && (
                <ColorBadge
                  label={p.workspace_types[0].name}
                  color={p.workspace_types[0].color}
                />
              )}

              <span className="text-xs px-3 py-1 rounded-full border bg-[var(--surface-soft)] border-[color:var(--border-soft)] text-[var(--text-muted)]">
                {p.source === "manual" ? "Manual" : "Craftly"}
              </span>
            </div>

            {isBoardCollapsed && (
              <div className="mt-3 text-xs text-[var(--text-faint)] rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2">
                {p.client_name || "No client"}
                {p.due_date ? ` • Due ${p.due_date}` : ""}
                {p.budget != null
                  ? ` • LKR ${Number(p.budget).toLocaleString()}`
                  : ""}
              </div>
            )}

            {!isBoardCollapsed && (
              <>
                <div
                  className={`mt-3 grid gap-3 ${
                    compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      Client
                    </label>
                    <select
                      value={p.client_id ?? ""}
                      onChange={(e) =>
                        void updateClientAndSubclient(p.id, e.target.value, "")
                      }
                      className={premiumSelectClass}
                    >
                      <option value="">No client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id} className="text-black">
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      Sub client
                    </label>
                    <select
                      value={p.subclient_id ?? ""}
                      onChange={(e) =>
                        void updateClientAndSubclient(
                          p.id,
                          p.client_id ?? "",
                          e.target.value
                        )
                      }
                      className={premiumSelectClass}
                      disabled={!p.client_id}
                    >
                      <option value="">No sub client</option>
                      {subclients
                        .filter((sub) => sub.client_id === p.client_id)
                        .map((sub) => (
                          <option key={sub.id} value={sub.id} className="text-black">
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-medium text-white/60">
                    Description
                  </label>
                <textarea
                  value={p.description ?? ""}
                  onChange={(e) =>
                    setProjects((prev) =>
                      prev.map((project) =>
                        project.id === p.id
                          ? {
                              ...project,
                              description: e.target.value,
                            }
                          : project
                      )
                    )
                  }
                  onBlur={(e) => void updateDescription(p.id, e.target.value)}
                  rows={compact ? 2 : 3}
                  className="mt-1 w-full appearance-none rounded-lg border border-[color:var(--border-soft)] px-3 py-2 bg-[var(--surface-soft)] text-sm text-[var(--text-main)] opacity-80 outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                  placeholder="Add project notes..."
                />
                </div>

                <div
                  className={`mt-3 grid gap-3 ${
                    compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      Due date
                    </label>
                    <input
                      type="date"
                      value={p.due_date ?? ""}
                      onChange={(e) => void updateDueDate(p.id, e.target.value)}
                      className="mt-1 w-full appearance-none rounded-lg border border-[color:var(--border-soft)] px-3 py-2 bg-[var(--surface-soft)] text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      Budget (LKR)
                    </label>
                    <input
                      inputMode="decimal"
                      value={p.budget != null ? String(p.budget) : ""}
                      onChange={(e) => void updateBudget(p.id, e.target.value)}
                      className="mt-1 w-full appearance-none rounded-lg border border-[color:var(--border-soft)] px-3 py-2 bg-[var(--surface-soft)] text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                      placeholder="25000"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`flex flex-col gap-2 ${compact ? "" : "lg:min-w-[220px]"}`}>
            {isBoardCollapsed && (
              <div className="text-xs text-[var(--text-faint)] rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2">
                {p.client_name || "No client"}
                {p.due_date ? ` • Due ${p.due_date}` : ""}
                {p.budget != null ? ` • LKR ${Number(p.budget).toLocaleString()}` : ""}
              </div>
            )}

            <select
              value={p.status_id ?? ""}
              onChange={(e) => void updateStatus(p.id, e.target.value)}
              className={premiumSelectClass}
            >
              <option value="">No status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id} className="text-black">
                  Status: {status.name}
                </option>
              ))}
            </select>

            <select
              value={p.priority_id ?? ""}
              onChange={(e) => void updatePriority(p.id, e.target.value)}
              className={premiumSelectClass}
            >
              <option value="">No priority</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id} className="text-black">
                  Priority: {priority.name}
                </option>
              ))}
            </select>

            <select
              value={p.type_id ?? ""}
              onChange={(e) => void updateType(p.id, e.target.value)}
              className={premiumSelectClass}
            >
              <option value="">No type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id} className="text-black">
                  Type: {type.name}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => openEditModal(p)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-sm text-[var(--text-main)] transition hover:bg-[var(--surface-hover)]"
              >
                Edit
              </button>

              <button
                onClick={() => void deleteProject(p.id)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-400/20 bg-red-500/10 text-sm text-red-300 transition hover:bg-red-500/15"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-1 md:px-0 text-[var(--text-main)]">
      <section
        className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
        style={{ backgroundImage: "var(--panel-surface)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
              Workspace
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Track your Craftly and outside client work in one place.
            </p>
          </div>

          <a
            href="/workspace/settings"
            className="inline-flex w-full md:w-auto items-center justify-center rounded-lg border border-[color:var(--border-soft)] px-4 py-2 text-[var(--text-main)] opacity-80 transition hover:bg-[var(--surface-hover)]"
          >
            Settings
          </a>
        </div>
      </section>

      <section
        className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
        style={{ backgroundImage: "var(--panel-surface)" }}
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">
            Create Manual Project
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Add work even if it didn’t come from Craftly.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Project title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={darkInputClass}
                placeholder="Wedding Retouch Pack"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setSubclientId("");
                }}
                className={premiumSelectClass}
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="text-black">
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Sub Client
              </label>
              <select
                value={subclientId}
                onChange={(e) => setSubclientId(e.target.value)}
                className={premiumSelectClass}
                disabled={!clientId}
              >
                <option value="">Select sub client</option>
                {filteredSubclients.map((sub) => (
                  <option key={sub.id} value={sub.id} className="text-black">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Type
              </label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className={premiumSelectClass}
              >
                <option value="">Select type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id} className="text-black">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Status
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className={premiumSelectClass}
              >
                <option value="">Select status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id} className="text-black">
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Priority
              </label>
              <select
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className={premiumSelectClass}
              >
                <option value="">Select priority</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id} className="text-black">
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={darkInputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Budget (optional)
              </label>
              <input
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={darkInputClass}
                placeholder="25000"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-main)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={darkTextareaClass}
              placeholder="Short notes about the work..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] hover:brightness-95 active:brightness-90 transition disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>

            <div className="text-xs px-3 py-1 rounded-full border bg-[var(--surface-soft)] border-[color:var(--border-soft)] text-[var(--text-muted)]">
              Source: manual
            </div>
          </div>

          {msg && (
            <div className="text-sm text-[var(--text-main)] opacity-80 bg-[var(--surface-soft)] border border-[color:var(--border-soft)] rounded-xl p-3">
              {msg}
            </div>
          )}
        </form>
      </section>

      <section
        className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
        style={{ backgroundImage: "var(--panel-surface)" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              My Projects
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              All your tracked work, whether it came from Craftly or outside.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-1">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === "board"
                    ? "bg-[var(--surface-hover)] text-[var(--text-main)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === "list"
                    ? "bg-[var(--surface-hover)] text-[var(--text-main)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                List
              </button>
            </div>

            <div className="text-sm text-[var(--text-muted)]">
              {projects.length} total
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-[var(--text-muted)]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="mt-4 text-[var(--text-muted)]">No projects yet.</div>
        ) : viewMode === "list" ? (
          <div className="mt-4 grid gap-4">
            {projects.map((p) => renderProjectCard(p))}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max items-start">
              {boardColumns.map((column) => (
                <div
                  key={column.id}
                  className="w-[360px] shrink-0 rounded-2xl border border-[color:var(--border-soft)] p-4 backdrop-blur-xl shadow-[var(--card-shadow-soft)]"
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: column.color || "#64748b" }}
                      />
                      <h3 className="font-semibold text-[var(--text-main)] truncate">
                        {column.name}
                      </h3>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full border bg-[var(--surface-soft)] border-[color:var(--border-soft)] text-[var(--text-muted)]">
                      {column.projects.length}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {column.projects.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-faint)]">
                        No projects in this column.
                      </div>
                    ) : (
                      column.projects.map((project) =>
                        renderProjectCard(project, true)
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {editingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
            onClick={closeEditModal}
          />

          <div
            className="relative z-10 w-full max-w-3xl rounded-2xl border border-[color:var(--border-soft)] backdrop-blur-2xl shadow-[var(--card-shadow-strong)]"
            style={{ backgroundImage: "var(--panel-surface-strong)" }}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-main)]">
                  Edit Project
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Update project details, workflow, and priority.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="text-sm px-3 py-2 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-[var(--text-main)] hover:bg-[var(--surface-hover)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={saveProjectEdits} className="p-6 grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Project title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={darkInputClass}
                    placeholder="Wedding Retouch Pack"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Client
                  </label>
                  <select
                    value={editClientId}
                    onChange={(e) => {
                      setEditClientId(e.target.value);
                      setEditSubclientId("");
                    }}
                    className={premiumSelectClass}
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="text-black">
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Sub Client
                  </label>
                  <select
                    value={editSubclientId}
                    onChange={(e) => setEditSubclientId(e.target.value)}
                    className={premiumSelectClass}
                    disabled={!editClientId}
                  >
                    <option value="">Select sub client</option>
                    {filteredEditSubclients.map((sub) => (
                      <option key={sub.id} value={sub.id} className="text-black">
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Type
                  </label>
                  <select
                    value={editTypeId}
                    onChange={(e) => setEditTypeId(e.target.value)}
                    className={premiumSelectClass}
                  >
                    <option value="">Select type</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id} className="text-black">
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Status
                  </label>
                  <select
                    value={editStatusId}
                    onChange={(e) => setEditStatusId(e.target.value)}
                    className={premiumSelectClass}
                  >
                    <option value="">Select status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id} className="text-black">
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Priority
                  </label>
                  <select
                    value={editPriorityId}
                    onChange={(e) => setEditPriorityId(e.target.value)}
                    className={premiumSelectClass}
                  >
                    <option value="">Select priority</option>
                    {priorities.map((priority) => (
                      <option key={priority.id} value={priority.id} className="text-black">
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className={darkInputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Budget (optional)
                  </label>
                  <input
                    inputMode="decimal"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className={darkInputClass}
                    placeholder="25000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-main)]">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className={darkTextareaClass}
                  placeholder="Short notes about the work..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-[var(--text-main)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] hover:brightness-95 active:brightness-90 transition disabled:opacity-60"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

