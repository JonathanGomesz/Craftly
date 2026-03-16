import { useEffect, useState, type FormEvent } from "react";
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
  } | null;

  workspace_subclients?: {
    id: string;
    name: string;
  } | null;

  workspace_statuses?: {
    id: string;
    name: string;
    color: string | null;
  } | null;

  workspace_priorities?: {
    id: string;
    name: string;
    color: string | null;
  } | null;

  workspace_types?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

function toOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

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

export default function Workspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [clients, setClients] = useState<WorkspaceClient[]>([]);
  const [subclients, setSubclients] = useState<WorkspaceSubclient[]>([]);
  const [statuses, setStatuses] = useState<WorkspaceStatus[]>([]);
  const [priorities, setPriorities] = useState<WorkspacePriority[]>([]);
  const [types, setTypes] = useState<WorkspaceType[]>([]);

  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

    const normalizedProjects: Project[] = ((projectsRes.data ?? []) as any[]).map(
      (project) => ({
        ...project,
        workspace_clients: toOne(project.workspace_clients),
        workspace_subclients: toOne(project.workspace_subclients),
        workspace_statuses: toOne(project.workspace_statuses),
        workspace_priorities: toOne(project.workspace_priorities),
        workspace_types: toOne(project.workspace_types),
      })
    );

    setProjects(normalizedProjects);
    setClients((clientsRes.data ?? []) as WorkspaceClient[]);
    setSubclients((subclientsRes.data ?? []) as WorkspaceSubclient[]);
    setStatuses((statusesRes.data ?? []) as WorkspaceStatus[]);
    setPriorities((prioritiesRes.data ?? []) as WorkspacePriority[]);
    setTypes((typesRes.data ?? []) as WorkspaceType[]);

    setLoading(false);
  }

  const filteredSubclients = clientId
    ? subclients.filter((s) => s.client_id === clientId)
    : [];

  const filteredEditSubclients = editClientId
    ? subclients.filter((s) => s.client_id === editClientId)
    : [];

  const visibleProjects = projects.filter((project) => {
    if (clientFilter && project.client_id !== clientFilter) return false;
    if (statusFilter && project.status_id !== statusFilter) return false;
    if (priorityFilter && project.priority_id !== priorityFilter) return false;
    if (typeFilter && project.type_id !== typeFilter) return false;
    return true;
  });

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
                ? {
                    id: selectedStatus.id,
                    name: selectedStatus.name,
                    color: selectedStatus.color,
                  }
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
                ? {
                    id: selectedPriority.id,
                    name: selectedPriority.name,
                    color: selectedPriority.color,
                  }
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
                ? {
                    id: selectedType.id,
                    name: selectedType.name,
                    color: selectedType.color,
                  }
                : null,
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

  function inlineSelectStyle(color: string | null) {
    const safeColor = color || "#64748b";

    return {
      color: safeColor,
      borderColor: safeColor,
      backgroundColor: `${safeColor}18`,
      textAlign: "center" as const,
      textAlignLast: "center" as const,
    };
  }

  function renderProjectCard(p: Project) {
    const statusMeta = p.workspace_statuses ?? null;
    const priorityMeta = p.workspace_priorities ?? null;
    const typeMeta = p.workspace_types ?? null;
    const clientLabel =
      p.workspace_clients?.name ?? p.client_name ?? "No client";
    const subclientLabel = p.workspace_subclients?.name ?? "No sub client";

    return (
      <div
        key={p.id}
        className="rounded-2xl border border-[color:var(--border-soft)] p-4 backdrop-blur-lg shadow-[var(--card-shadow-soft)]"
        style={{ backgroundColor: "var(--surface-soft)" }}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 space-y-3">
            <div className="min-w-0 text-base font-semibold text-[var(--text-main)] truncate">
              {p.title}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
              <div className="truncate">{clientLabel}</div>
              <div className="text-[var(--text-faint)]">•</div>
              <div className="truncate">{subclientLabel}</div>
              <div className="text-[var(--text-faint)]">•</div>
              <select
                value={p.status_id ?? ""}
                onChange={(e) => void updateStatus(p.id, e.target.value)}
                className="h-10 min-w-[140px] flex-none appearance-none rounded-full border px-4 text-center text-xs font-medium leading-none outline-none transition"
                style={inlineSelectStyle(statusMeta?.color ?? null)}
              >
                <option value="" className="text-black">
                  No status
                </option>
                {statuses.map((status) => (
                  <option
                    key={status.id}
                    value={status.id}
                    className="text-black"
                  >
                    {status.name}
                  </option>
                ))}
              </select>
              <div className="text-[var(--text-faint)]">•</div>
              <select
                value={p.priority_id ?? ""}
                onChange={(e) => void updatePriority(p.id, e.target.value)}
                className="h-10 min-w-[140px] flex-none appearance-none rounded-full border px-4 text-center text-xs font-medium leading-none outline-none transition"
                style={inlineSelectStyle(priorityMeta?.color ?? null)}
              >
                <option value="" className="text-black">
                  No priority
                </option>
                {priorities.map((priority) => (
                  <option
                    key={priority.id}
                    value={priority.id}
                    className="text-black"
                  >
                    {priority.name}
                  </option>
                ))}
              </select>
              <div className="text-[var(--text-faint)]">•</div>
              <select
                value={p.type_id ?? ""}
                onChange={(e) => void updateType(p.id, e.target.value)}
                className="h-10 min-w-[160px] flex-none appearance-none rounded-full border px-4 text-center text-xs font-medium leading-none outline-none transition"
                style={inlineSelectStyle(typeMeta?.color ?? null)}
              >
                <option value="" className="text-black">
                  No type
                </option>
                {types.map((type) => (
                  <option key={type.id} value={type.id} className="text-black">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center lg:justify-end">
            <button
              onClick={() => openEditModal(p)}
              className="px-3 py-2 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-sm text-[var(--text-main)] transition hover:bg-[var(--surface-hover)]"
            >
              Edit
            </button>

            <button
              onClick={() => void deleteProject(p.id)}
              className="px-3 py-2 rounded-lg border border-red-400/20 bg-red-500/10 text-sm text-red-300 transition hover:bg-red-500/15"
            >
              Delete
            </button>
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
                  <option
                    key={client.id}
                    value={client.id}
                    className="text-black"
                  >
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
                  <option
                    key={priority.id}
                    value={priority.id}
                    className="text-black"
                  >
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

          <div className="flex flex-col gap-3 md:items-end">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:w-auto">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="min-w-[180px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
              >
                <option value="" className="text-black">
                  All clients
                </option>
                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                    className="text-black"
                  >
                    {client.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[160px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
              >
                <option value="" className="text-black">
                  All statuses
                </option>
                {statuses.map((status) => (
                  <option
                    key={status.id}
                    value={status.id}
                    className="text-black"
                  >
                    {status.name}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="min-w-[160px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
              >
                <option value="" className="text-black">
                  All priorities
                </option>
                {priorities.map((priority) => (
                  <option
                    key={priority.id}
                    value={priority.id}
                    className="text-black"
                  >
                    {priority.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="min-w-[160px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
              >
                <option value="" className="text-black">
                  All types
                </option>
                {types.map((type) => (
                  <option key={type.id} value={type.id} className="text-black">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setClientFilter("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setTypeFilter("");
                }}
                className="px-3 py-2 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-sm text-[var(--text-main)] transition hover:bg-[var(--surface-hover)]"
              >
                Clear Filters
              </button>

              <div className="text-sm text-[var(--text-muted)]">
                {visibleProjects.length} total
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-[var(--text-muted)]">
            Loading projects...
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="mt-4 text-[var(--text-muted)]">
            No projects found.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {visibleProjects.map((p) => renderProjectCard(p))}
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
                      <option
                        key={client.id}
                        value={client.id}
                        className="text-black"
                      >
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
                      <option
                        key={status.id}
                        value={status.id}
                        className="text-black"
                      >
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
                      <option
                        key={priority.id}
                        value={priority.id}
                        className="text-black"
                      >
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