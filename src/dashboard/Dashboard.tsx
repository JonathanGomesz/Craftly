import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Job = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type Proposal = {
  id: string;
  job_id: string;
  price: number;
  delivery_days: number;
  status: string;
  created_at: string;
  job?: { title: string } | null;
};

type ProposalRow = {
  id: string;
  job_id: string;
  price: number;
  delivery_days: number;
  status: string;
  created_at: string;
  jobs?: { title?: string | null } | { title?: string | null }[] | null;
};

type Contract = {
  id: string;
  job_id: string;
  status: string;
  started_at: string;
};

function statusPill(status: string) {
  const s = status.toLowerCase();

  if (s === "open") return "text-emerald-200 border-emerald-400/20 bg-emerald-500/10";
  if (s === "hired") return "text-amber-200 border-amber-400/20 bg-amber-500/10";
  if (s === "in_progress") return "text-sky-200 border-sky-400/20 bg-sky-500/10";
  if (s === "delivered") return "text-indigo-200 border-indigo-400/20 bg-indigo-500/10";
  if (s === "completed") return "text-emerald-200 border-emerald-400/20 bg-emerald-500/10";
  if (s === "cancelled") return "text-zinc-300 border-zinc-400/20 bg-zinc-500/10";
  return "text-[var(--text-main)] opacity-80 border-[color:var(--border-soft)] bg-[var(--surface-soft)]";
}

function prettyStatus(status: string) {
  return status.replaceAll("_", " ");
}

const panelClass =
  "rounded-2xl border border-[color:var(--border-soft)] backdrop-blur-xl shadow-[var(--card-shadow)]";

const itemClass =
  "rounded-xl border border-[color:var(--border-soft)] p-4 transition block hover:border-[color:var(--accent-soft)]";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void loadAll();
  }, []);

  const totals = useMemo(() => {
    const myOpenJobs = jobs.filter((j) => j.status === "open").length;
    const activeContracts = contracts.filter(
      (c) => c.status === "active" || c.status === "in_progress"
    ).length;
    const deliveredContracts = contracts.filter((c) => c.status === "delivered").length;
    const acceptedProposals = proposals.filter((p) => p.status === "accepted").length;

    return {
      myOpenJobs,
      activeContracts,
      deliveredContracts,
      acceptedProposals,
    };
  }, [jobs, contracts, proposals]);

  async function loadAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setErr(null);

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;

    if (!uid) {
      setErr("Not logged in");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: jData, error: jErr } = await supabase
      .from("jobs")
      .select("id,title,status,created_at")
      .eq("client_id", uid)
      .order("created_at", { ascending: false });

    if (jErr) setErr(jErr.message);
    const jobsList = (jData ?? []) as Job[];
    setJobs(jobsList);

    if (jobsList.length > 0) {
      const jobIds = jobsList.map((j) => j.id);

      const { data: pCountData, error: pCountErr } = await supabase
        .from("proposals")
        .select("job_id")
        .in("job_id", jobIds);

      if (pCountErr) {
        setErr(pCountErr.message);
        setProposalCounts({});
      } else {
        const counts: Record<string, number> = {};
        for (const row of pCountData ?? []) {
          const jid = (row as { job_id: string }).job_id;
          counts[jid] = (counts[jid] ?? 0) + 1;
        }
        setProposalCounts(counts);
      }
    } else {
      setProposalCounts({});
    }

    const { data: pData, error: pErr } = await supabase
      .from("proposals")
      .select("id,job_id,price,delivery_days,status,created_at, jobs:jobs(title)")
      .eq("creative_id", uid)
      .order("created_at", { ascending: false });

    if (pErr) setErr(pErr.message);

    const mapped = ((pData ?? []) as ProposalRow[]).map((p) => {
      const joinedJob = Array.isArray(p.jobs) ? p.jobs[0] ?? null : p.jobs ?? null;

      return {
        id: p.id,
        job_id: p.job_id,
        price: p.price,
        delivery_days: p.delivery_days,
        status: p.status,
        created_at: p.created_at,
        job: joinedJob?.title ? { title: joinedJob.title } : null,
      };
    });
    setProposals(mapped as Proposal[]);

    const { data: cData, error: cErr } = await supabase
      .from("contracts")
      .select("id,job_id,status,started_at")
      .or(`client_id.eq.${uid},creative_id.eq.${uid}`)
      .order("started_at", { ascending: false });

    if (cErr) setErr(cErr.message);
    setContracts((cData ?? []) as Contract[]);

    setLoading(false);
    setRefreshing(false);
  }

  return (
    <div className="space-y-8 text-[var(--text-main)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-main)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track your jobs, bids, and contracts in one place.
          </p>
        </div>

        <button
          onClick={() => void loadAll(true)}
          disabled={loading || refreshing}
          className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:border-[color:var(--accent-soft)] hover:bg-[var(--surface-hover)] disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && !loading && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["My open jobs", totals.myOpenJobs],
          ["Active contracts", totals.activeContracts],
          ["Delivered waiting", totals.deliveredContracts],
          ["Accepted proposals", totals.acceptedProposals],
        ].map(([label, value]) => (
          <div
            key={label}
            className={`${panelClass} p-5`}
            style={{ backgroundImage: "var(--panel-surface)" }}
          >
            <div className="text-sm text-[var(--text-muted)]">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--text-main)]">{value}</div>
          </div>
        ))}
      </div>

      {loading && <div className="text-[var(--text-muted)]">Loading…</div>}

      {!loading && (
        <section className={`${panelClass} p-6`} style={{ backgroundImage: "var(--panel-surface)" }}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">My Contracts</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Work you’re currently doing or managing.
              </p>
            </div>
            <div className="text-sm text-[var(--text-muted)]">{contracts.length}</div>
          </div>

          <div className="mt-4 grid gap-3">
            {contracts.length === 0 ? (
              <div className="text-[var(--text-muted)]">No contracts yet.</div>
            ) : (
              contracts.map((c) => (
                <Link
                  key={c.id}
                  to={`/contracts/${c.id}`}
                  className={itemClass}
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--text-main)]">
                        Contract #{c.id.slice(0, 8)}
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-muted)] opacity-90">
                        Started {new Date(c.started_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${statusPill(
                        c.status
                      )}`}
                    >
                      {prettyStatus(c.status)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {!loading && (
        <section className={`${panelClass} p-6`} style={{ backgroundImage: "var(--panel-surface)" }}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">My Jobs (Client)</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Jobs you posted + how many bids they got.
              </p>
            </div>
            <div className="text-sm text-[var(--text-muted)]">{jobs.length}</div>
          </div>

          <div className="mt-4 grid gap-3">
            {jobs.length === 0 ? (
              <div className="text-[var(--text-muted)]">
                You haven’t posted any jobs yet.{" "}
                <Link className="text-[var(--accent)] hover:underline" to="/post-job">
                  Post one →
                </Link>
              </div>
            ) : (
              jobs.map((j) => (
                <Link
                  key={j.id}
                  to={`/jobs/${j.id}`}
                  className={itemClass}
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--text-main)]">{j.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-muted)] opacity-90">
                        {new Date(j.created_at).toLocaleDateString()} •{" "}
                        <span className="font-medium text-[var(--text-main)] opacity-80">
                          {proposalCounts[j.id] ?? 0} proposals
                        </span>
                      </div>
                    </div>

                    <div
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${statusPill(
                        j.status
                      )}`}
                    >
                      {prettyStatus(j.status)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {!loading && (
        <section className={`${panelClass} p-6`} style={{ backgroundImage: "var(--panel-surface)" }}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">My Proposals (Creative)</h2>
              <p className="text-sm text-[var(--text-muted)]">Bids you’ve submitted.</p>
            </div>
            <div className="text-sm text-[var(--text-muted)]">{proposals.length}</div>
          </div>

          <div className="mt-4 grid gap-3">
            {proposals.length === 0 ? (
              <div className="text-[var(--text-muted)]">No proposals yet.</div>
            ) : (
              proposals.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[color:var(--border-soft)] p-4"
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--text-main)]">
                        {p.job?.title ?? `Job ${p.job_id.slice(0, 8)}`}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">
                        {p.delivery_days} days • LKR {Number(p.price).toLocaleString()}
                      </div>
                    </div>

                    <div
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${statusPill(
                        p.status
                      )}`}
                    >
                      {prettyStatus(p.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}