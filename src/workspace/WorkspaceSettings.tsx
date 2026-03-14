import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type WorkspaceClient = {
  id: string;
  name: string;
  color: string | null;
};

type WorkspaceSubclient = {
  id: string;
  client_id: string;
  name: string;
  color: string | null;
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
        color: "var(--text-main)",
        borderColor: safeColor,
        backgroundColor: `${safeColor}22`,
        boxShadow: `inset 0 0 0 1px ${safeColor}20`,
      }}
    >
      {label}
    </span>
  );
}

const darkInputClass =
  "rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] transition placeholder:text-[var(--text-faint)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

const darkSelectClass =
  "rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] transition focus:ring-2 focus:ring-[color:var(--accent-soft)]";

export default function WorkspaceSettings() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [clients, setClients] = useState<WorkspaceClient[]>([]);
  const [subclients, setSubclients] = useState<WorkspaceSubclient[]>([]);
  const [statuses, setStatuses] = useState<WorkspaceStatus[]>([]);
  const [priorities, setPriorities] = useState<WorkspacePriority[]>([]);
  const [types, setTypes] = useState<WorkspaceType[]>([]);

  const [clientName, setClientName] = useState("");

  const [subclientParentId, setSubclientParentId] = useState("");
  const [subclientName, setSubclientName] = useState("");

  const [statusName, setStatusName] = useState("");
  const [statusColor, setStatusColor] = useState("#3b82f6");
  const [statusSort, setStatusSort] = useState("0");

  const [priorityName, setPriorityName] = useState("");
  const [priorityColor, setPriorityColor] = useState("#ef4444");
  const [prioritySort, setPrioritySort] = useState("0");

  const [typeName, setTypeName] = useState("");
  const [typeColor, setTypeColor] = useState("#3b82f6");
  const [typeSort, setTypeSort] = useState("0");

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
      clientsRes,
      subclientsRes,
      statusesRes,
      prioritiesRes,
      typesRes,
    ] = await Promise.all([
      supabase
        .from("workspace_clients")
        .select("id,name,color")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),

      supabase
        .from("workspace_subclients")
        .select("id,client_id,name,color")
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

    if (clientsRes.error) setMsg(clientsRes.error.message);
    if (subclientsRes.error) setMsg(subclientsRes.error.message);
    if (statusesRes.error) setMsg(statusesRes.error.message);
    if (prioritiesRes.error) setMsg(prioritiesRes.error.message);
    if (typesRes.error) setMsg(typesRes.error.message);

    setClients((clientsRes.data ?? []) as WorkspaceClient[]);
    setSubclients((subclientsRes.data ?? []) as WorkspaceSubclient[]);
    setStatuses((statusesRes.data ?? []) as WorkspaceStatus[]);
    setPriorities((prioritiesRes.data ?? []) as WorkspacePriority[]);
    setTypes((typesRes.data ?? []) as WorkspaceType[]);

    setLoading(false);
  }

  async function addClient(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uid = await getUserId();
    if (!uid) return setMsg("Please log in.");
    if (!clientName.trim()) return setMsg("Client name is required.");

    const { error } = await supabase.from("workspace_clients").insert({
      user_id: uid,
      name: clientName.trim(),
      color: null,
    });

    if (error) return setMsg(error.message);

    setClientName("");
    setMsg("Client added ✅");
    await loadAll();
  }

  async function addSubclient(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uid = await getUserId();
    if (!uid) return setMsg("Please log in.");
    if (!subclientParentId) return setMsg("Choose a parent client.");
    if (!subclientName.trim()) return setMsg("Sub client name is required.");

    const { error } = await supabase.from("workspace_subclients").insert({
      user_id: uid,
      client_id: subclientParentId,
      name: subclientName.trim(),
      color: null,
    });

    if (error) return setMsg(error.message);

    setSubclientName("");
    setMsg("Sub client added ✅");
    await loadAll();
  }

  async function addStatus(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uid = await getUserId();
    if (!uid) return setMsg("Please log in.");
    if (!statusName.trim()) return setMsg("Status name is required.");

    const { error } = await supabase.from("workspace_statuses").insert({
      user_id: uid,
      name: statusName.trim(),
      color: statusColor || null,
      sort_order: Number(statusSort) || 0,
    });

    if (error) return setMsg(error.message);

    setStatusName("");
    setStatusColor("#3b82f6");
    setStatusSort("0");
    setMsg("Status added ✅");
    await loadAll();
  }

  async function addPriority(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uid = await getUserId();
    if (!uid) return setMsg("Please log in.");
    if (!priorityName.trim()) return setMsg("Priority name is required.");

    const { error } = await supabase.from("workspace_priorities").insert({
      user_id: uid,
      name: priorityName.trim(),
      color: priorityColor || null,
      sort_order: Number(prioritySort) || 0,
    });

    if (error) return setMsg(error.message);

    setPriorityName("");
    setPriorityColor("#ef4444");
    setPrioritySort("0");
    setMsg("Priority added ✅");
    await loadAll();
  }

  async function addType(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uid = await getUserId();
    if (!uid) return setMsg("Please log in.");
    if (!typeName.trim()) return setMsg("Type name is required.");

    const { error } = await supabase.from("workspace_types").insert({
      user_id: uid,
      name: typeName.trim(),
      color: typeColor || null,
      sort_order: Number(typeSort) || 0,
    });

    if (error) return setMsg(error.message);

    setTypeName("");
    setTypeColor("#3b82f6");
    setTypeSort("0");
    setMsg("Type added ✅");
    await loadAll();
  }

  async function deleteItem(
    table:
      | "workspace_clients"
      | "workspace_subclients"
      | "workspace_statuses"
      | "workspace_priorities"
      | "workspace_types",
    id: string
  ) {
    const ok = window.confirm("Delete this item?");
    if (!ok) return;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMsg(error.message);

    setMsg("Deleted ✅");
    await loadAll();
  }

  const subclientsGrouped = useMemo(() => {
    const map: Record<string, WorkspaceSubclient[]> = {};
    for (const s of subclients) {
      if (!map[s.client_id]) map[s.client_id] = [];
      map[s.client_id].push(s);
    }
    return map;
  }, [subclients]);

  return (
    <div className="space-y-8 text-[var(--text-main)]">
      <section
        className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
        style={{ backgroundImage: "var(--panel-surface)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
              Workspace Settings
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage your clients, sub clients, statuses, priorities, and colors.
            </p>
          </div>

          <Link
            to="/workspace"
            className="px-4 py-2 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-[var(--text-main)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            Back to Workspace
          </Link>
        </div>

        {msg && (
          <div className="mt-4 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--text-main)]">
            {msg}
          </div>
        )}
      </section>

      {loading ? (
        <div className="text-[var(--text-muted)]">Loading settings...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Clients */}
            <section
              className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
              style={{ backgroundImage: "var(--panel-surface)" }}
            >
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Clients</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Example: Mideation, Stratify
              </p>

              <form onSubmit={addClient} className="mt-4 grid gap-3">
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={darkInputClass}
                  placeholder="Client name"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-[color:var(--accent-border)] bg-[var(--accent)] px-4 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95"
                >
                  Add Client
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {clients.length === 0 ? (
                  <div className="text-[var(--text-muted)] text-sm">No clients yet.</div>
                ) : (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[var(--text-main)]">
                          {client.name}
                        </span>
                        <button
                          onClick={() =>
                            void deleteItem("workspace_clients", client.id)
                          }
                          className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--surface-hover)]"
                        >
                          Delete
                        </button>
                      </div>

                      {subclientsGrouped[client.id]?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {subclientsGrouped[client.id].map((sub) => (
                            <span
                              key={sub.id}
                              className="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-hover)] px-3 py-1 text-xs text-[var(--text-main)] opacity-90"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Sub clients */}
            <section
              className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
              style={{ backgroundImage: "var(--panel-surface)" }}
            >
              <h2 className="text-lg font-semibold text-[var(--text-main)]">
                Sub Clients
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Example: Mideation → Hero
              </p>

              <form onSubmit={addSubclient} className="mt-4 grid gap-3">
                <select
                  value={subclientParentId}
                  onChange={(e) => setSubclientParentId(e.target.value)}
                  className={darkSelectClass}
                >
                  <option value="" className="text-black">
                    Choose parent client
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

                <input
                  value={subclientName}
                  onChange={(e) => setSubclientName(e.target.value)}
                  className={darkInputClass}
                  placeholder="Sub client name"
                />

                <button
                  type="submit"
                  className="rounded-xl border border-[color:var(--accent-border)] bg-[var(--accent)] px-4 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95"
                >
                  Add Sub Client
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {subclients.length === 0 ? (
                  <div className="text-[var(--text-muted)] text-sm">
                    No sub clients yet.
                  </div>
                ) : (
                  subclients.map((sub) => {
                    const parent = clients.find((c) => c.id === sub.client_id);
                    return (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between gap-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-hover)] px-3 py-1 text-xs text-[var(--text-main)] opacity-90"
                          >
                            {`${parent?.name ?? "Client"} → ${sub.name}`}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            void deleteItem("workspace_subclients", sub.id)
                          }
                          className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--surface-hover)]"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Statuses */}
            <section
              className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
              style={{ backgroundImage: "var(--panel-surface)" }}
            >
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Statuses</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Example: Pending, To Do, Done
              </p>

              <form onSubmit={addStatus} className="mt-4 grid gap-3">
                <input
                  value={statusName}
                  onChange={(e) => setStatusName(e.target.value)}
                  className={darkInputClass}
                  placeholder="Status name"
                />

                <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: statusColor }}
                  />
                  <span className="text-sm text-[var(--text-main)] opacity-80">Pick color</span>

                  <input
                    type="color"
                    value={statusColor}
                    onChange={(e) => setStatusColor(e.target.value)}
                    className="ml-auto h-10 w-14 cursor-pointer rounded border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-1"
                  />

                  <span className="text-sm text-[var(--text-muted)]">
                    {statusColor}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-[var(--text-muted)] opacity-80 mb-2">Preview</div>
                  <ColorBadge
                    label={statusName.trim() || "Status preview"}
                    color={statusColor}
                  />
                </div>

                <input
                  value={statusSort}
                  onChange={(e) => setStatusSort(e.target.value)}
                  className={darkInputClass}
                  placeholder="Sort order"
                  inputMode="numeric"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-[color:var(--accent-border)] bg-[var(--accent)] px-4 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95"
                >
                  Add Status
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {statuses.length === 0 ? (
                  <div className="text-[var(--text-muted)] text-sm">
                    No statuses yet.
                  </div>
                ) : (
                  statuses.map((status) => (
                    <div
                      key={status.id}
                      className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <ColorBadge label={status.name} color={status.color} />
                        <span className="text-xs text-[var(--text-muted)] opacity-80">
                          order: {status.sort_order}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          void deleteItem("workspace_statuses", status.id)
                        }
                        className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Priorities */}
            <section
              className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
              style={{ backgroundImage: "var(--panel-surface)" }}
            >
              <h2 className="text-lg font-semibold text-[var(--text-main)]">
                Priorities
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Example: Low, Medium, High, Urgent
              </p>

              <form onSubmit={addPriority} className="mt-4 grid gap-3">
                <input
                  value={priorityName}
                  onChange={(e) => setPriorityName(e.target.value)}
                  className={darkInputClass}
                  placeholder="Priority name"
                />

                <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: priorityColor }}
                  />
                  <span className="text-sm text-[var(--text-main)] opacity-80">Pick color</span>

                  <input
                    type="color"
                    value={priorityColor}
                    onChange={(e) => setPriorityColor(e.target.value)}
                    className="ml-auto h-10 w-14 cursor-pointer rounded border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-1"
                  />

                  <span className="text-sm text-[var(--text-muted)]">
                    {priorityColor}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-[var(--text-muted)] opacity-80 mb-2">Preview</div>
                  <ColorBadge
                    label={priorityName.trim() || "Priority preview"}
                    color={priorityColor}
                  />
                </div>

                <input
                  value={prioritySort}
                  onChange={(e) => setPrioritySort(e.target.value)}
                  className={darkInputClass}
                  placeholder="Sort order"
                  inputMode="numeric"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-[color:var(--accent-border)] bg-[var(--accent)] px-4 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95"
                >
                  Add Priority
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {priorities.length === 0 ? (
                  <div className="text-[var(--text-muted)] text-sm">
                    No priorities yet.
                  </div>
                ) : (
                  priorities.map((priority) => (
                    <div
                      key={priority.id}
                      className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <ColorBadge
                          label={priority.name}
                          color={priority.color}
                        />
                        <span className="text-xs text-[var(--text-muted)] opacity-80">
                          order: {priority.sort_order}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          void deleteItem("workspace_priorities", priority.id)
                        }
                        className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Types */}
            <section
              className="rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]"
              style={{ backgroundImage: "var(--panel-surface)" }}
            >
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Types</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Example: Logo, Album, Design, Video
              </p>

              <form onSubmit={addType} className="mt-4 grid gap-3">
                <input
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className={darkInputClass}
                  placeholder="Type name"
                />

                <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: typeColor }}
                  />
                  <span className="text-sm text-[var(--text-main)] opacity-80">Pick color</span>

                  <input
                    type="color"
                    value={typeColor}
                    onChange={(e) => setTypeColor(e.target.value)}
                    className="ml-auto h-10 w-14 cursor-pointer rounded border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-1"
                  />

                  <span className="text-sm text-[var(--text-muted)]">
                    {typeColor}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-[var(--text-muted)] opacity-80 mb-2">Preview</div>
                  <ColorBadge
                    label={typeName.trim() || "Type preview"}
                    color={typeColor}
                  />
                </div>

                <input
                  value={typeSort}
                  onChange={(e) => setTypeSort(e.target.value)}
                  className={darkInputClass}
                  placeholder="Sort order"
                  inputMode="numeric"
                />

                <button
                  type="submit"
                  className="rounded-xl border border-[color:var(--accent-border)] bg-[var(--accent)] px-4 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95"
                >
                  Add Type
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {types.length === 0 ? (
                  <div className="text-[var(--text-muted)] text-sm">No types yet.</div>
                ) : (
                  types.map((type) => (
                    <div
                      key={type.id}
                      className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <ColorBadge label={type.name} color={type.color} />
                        <span className="text-xs text-[var(--text-muted)] opacity-80">
                          order: {type.sort_order}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          void deleteItem("workspace_types", type.id)
                        }
                        className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}