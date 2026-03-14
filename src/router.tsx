import WorkspaceSettings from "./workspace/WorkspaceSettings";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Link, createBrowserRouter, useNavigate, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import Profile from "./profile/Profile";
import { supabase } from "./lib/supabase";
import PostJob from "./jobs/PostJob";
import Dashboard from "./dashboard/Dashboard";
import Workspace from "./workspace/Workspace";

type Job = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number | null;
  status: "open" | "hired" | "in_progress" | "delivered" | "completed" | "cancelled";
  created_at: string;
};

type Proposal = {
  id: string;
  job_id: string;
  creative_id: string;
  price: number;
  delivery_days: number;
  message: string;
  status: "submitted" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type Contract = {
  id: string;
  job_id: string;
  proposal_id: string;
  client_id: string;
  creative_id: string;
  status: "active" | "delivered" | "completed" | "cancelled" | "disputed";
  started_at: string;
  delivered_at: string | null;
  completed_at: string | null;
};

type ContractMessage = {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const signupOk = new URLSearchParams(window.location.search).get("signup") === "1";

  const authPanelClass =
    "w-full max-w-md rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]";

  const authInputClass =
    "w-full rounded-xl border border-[color:var(--border-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] placeholder:text-[var(--text-faint)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next") || "/";
    navigate(next, { replace: true });
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 text-[var(--text-main)]">
      <div className={authPanelClass} style={{ backgroundImage: "var(--panel-surface)" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
          Log in
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Use your email + password.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className={authInputClass}
              placeholder="you@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className={authInputClass}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] hover:brightness-105 active:brightness-95 transition disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          {signupOk && (
            <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3">
              Account created. Check your email to confirm (if required), then log in.
            </div>
          )}

          {msg && (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-3">
              {msg}
            </div>
          )}

          <div className="text-sm text-[var(--text-muted)]">
            Don&apos;t have an account yet?{" "}
            <Link className="text-[var(--text-main)] hover:underline" to="/signup">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const authPanelClass =
    "w-full max-w-md rounded-2xl border border-[color:var(--border-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]";

  const authInputClass =
    "w-full rounded-xl border border-[color:var(--border-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] placeholder:text-[var(--text-faint)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    navigate("/login?signup=1", { replace: true });
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 text-[var(--text-main)]">
      <div className={authPanelClass} style={{ backgroundImage: "var(--panel-surface)" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
          Sign up
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Create an account with email + password.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-main)]">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className={authInputClass}
              placeholder="you@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-main)]">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className={authInputClass}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] hover:brightness-105 active:brightness-95 transition disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          {msg && (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-3">
              {msg}
            </div>
          )}

          <div className="text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link className="text-[var(--text-main)] hover:underline" to="/login">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("jobs")
      .select("id,client_id,title,description,budget_min,budget_max,status,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setJobs([]);
      setLoading(false);
      return;
    }

    setJobs((data ?? []) as Job[]);
    setLoading(false);
  }

  const panelClass =
    "rounded-2xl border border-[color:var(--border-soft)] backdrop-blur-xl shadow-[var(--card-shadow)]";

  const itemClass =
    "rounded-2xl border border-[color:var(--border-soft)] p-5 transition hover:border-[color:var(--accent-soft)]";

  return (
    <div className="space-y-8 text-[var(--text-main)]">
      <section className="rounded-2xl overflow-hidden border border-[color:var(--border-soft)] backdrop-blur-xl" style={{ backgroundImage: "var(--panel-surface-strong)" }}>
        <div className="px-8 py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-sm bg-[var(--surface-soft)] border border-[color:var(--border-soft)] rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              Sri Lanka’s Creative Hiring Platform
            </div>

            <h1 className="text-4xl font-semibold tracking-tight mt-4">
              Hire top creatives. <span className="text-[var(--text-muted)]">Fast.</span>
            </h1>

            <p className="text-[var(--text-muted)] mt-4 text-lg">
              Post a job, receive proposals from verified photographers, designers,
              editors, and videographers — then hire with confidence.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/post-job"
                className="px-5 py-3 rounded-lg font-semibold bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] hover:brightness-105 active:brightness-95 transition"
              >
                Post a Job
              </Link>
              <button
                onClick={() => {
                  void loadJobs();
                  window.scrollTo({ top: 700, behavior: "smooth" });
                }}
                className="px-5 py-3 rounded-lg font-semibold bg-[var(--surface-soft)] border border-[color:var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--surface-hover)] transition"
              >
                Browse Latest Jobs
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--surface-soft)] border border-[color:var(--border-soft)] rounded-xl p-4">
                <div className="text-sm text-[var(--text-muted)]">Fast hiring</div>
                <div className="text-xl font-semibold mt-1">Proposals</div>
              </div>
              <div className="bg-[var(--surface-soft)] border border-[color:var(--border-soft)] rounded-xl p-4">
                <div className="text-sm text-[var(--text-muted)]">Trusted profiles</div>
                <div className="text-xl font-semibold mt-1">Portfolios</div>
              </div>
              <div className="bg-[var(--surface-soft)] border border-[color:var(--border-soft)] rounded-xl p-4">
                <div className="text-sm text-[var(--text-muted)]">Transparent</div>
                <div className="text-xl font-semibold mt-1">Budgets</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
            Open Jobs
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            Browse the latest gigs posted by clients.
          </p>
        </div>

        <button
          onClick={() => void loadJobs()}
          className="bg-[var(--surface-strong)] hover:bg-[var(--surface-hover)] border border-[color:var(--border-soft)] text-[var(--text-main)] px-4 py-2 rounded-lg text-sm transition"
        >
          Refresh
        </button>
      </div>

      <div className={`${panelClass} p-5`} style={{ backgroundImage: "var(--panel-surface)" }}>
        {loading && <div className="text-[var(--text-muted)]">Loading…</div>}

        {!loading && err && (
          <div className="text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-3">
            Error loading jobs: <span className="text-red-300">{err}</span>
          </div>
        )}

        {!loading && !err && jobs.length === 0 && (
          <div className="text-[var(--text-muted)]">No jobs yet.</div>
        )}

        {!loading && !err && jobs.length > 0 && (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={itemClass}
                style={{ backgroundColor: "var(--surface-soft)" }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg text-[var(--text-main)]">
                      {job.title}
                    </div>
                    <div className="text-[var(--text-muted)] mt-1">
                      {job.description}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm text-[var(--text-main)]">
                      LKR {Number(job.budget_min).toLocaleString()}
                      {job.budget_max
                        ? ` – ${Number(job.budget_max).toLocaleString()}`
                        : ""}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] opacity-80 mt-1">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="bg-[var(--accent)] hover:brightness-105 active:brightness-95 text-[#0f140c] px-4 py-2 rounded-lg text-sm font-semibold border border-[color:var(--accent-border)] transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proposalMsg, setProposalMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: s } = await supabase.auth.getSession();
      setSessionUserId(s.session?.user?.id ?? null);

      if (!id) {
        setErr("Missing job id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      const { data: jobData, error } = await supabase
        .from("jobs")
        .select("id,client_id,title,description,budget_min,budget_max,status,created_at")
        .eq("id", id)
        .single();

      if (error) {
        setErr(error.message);
        setJob(null);
      } else {
        const j = jobData as Job;
        setJob(j);

        if (j.client_id === (s.session?.user?.id ?? null)) {
          setPLoading(true);
          setPErr(null);

          const { data: pData, error: pError } = await supabase
            .from("proposals")
            .select(
              "id,job_id,creative_id,price,delivery_days,message,status,created_at, profiles:profiles(full_name,avatar_url)"
            )
            .eq("job_id", id)
            .order("created_at", { ascending: false });

          if (pError) {
            setPErr(pError.message);
            setProposals([]);
          } else {
            const mapped = (pData ?? []).map((p: any) => ({
              id: p.id,
              job_id: p.job_id,
              creative_id: p.creative_id,
              price: p.price,
              delivery_days: p.delivery_days,
              message: p.message,
              status: p.status,
              created_at: p.created_at,
              profile: p.profiles ?? null,
            }));
            setProposals(mapped as Proposal[]);
          }

          setPLoading(false);
        } else {
          setProposals([]);
        }
      }

      setLoading(false);
    })();
  }, [id]);

  async function submitProposal() {
    if (!job || !sessionUserId) return;

    setProposalMsg(null);

    const p = Number(price);
    const d = Number(days);

    if (!Number.isFinite(p) || p <= 0) return setProposalMsg("Price must be > 0");
    if (!Number.isFinite(d) || d <= 0) return setProposalMsg("Delivery days must be > 0");
    if (!message.trim()) return setProposalMsg("Message is required");

    setSubmitting(true);

    const { error } = await supabase.from("proposals").insert({
      job_id: job.id,
      creative_id: sessionUserId,
      price: p,
      delivery_days: d,
      message: message.trim(),
      status: "submitted",
    });

    setSubmitting(false);

    if (error) {
      setProposalMsg(error.message);
      return;
    }

    setProposalMsg("Proposal sent ✅");
    setOpen(false);
    setPrice("");
    setDays("");
    setMessage("");
  }

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pLoading, setPLoading] = useState(false);
  const [pErr, setPErr] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function acceptProposal(p: Proposal) {
    if (!job || !sessionUserId) return;
    if (job.client_id !== sessionUserId) return;
    if (job.status !== "open") return;

    setAcceptingId(p.id);
    setPErr(null);

    const { error: upErr } = await supabase
      .from("proposals")
      .update({ status: "accepted" })
      .eq("id", p.id);

    if (upErr) {
      setPErr(upErr.message);
      setAcceptingId(null);
      return;
    }

    const { data: cData, error: cErr } = await supabase
      .from("contracts")
      .insert({
        job_id: job.id,
        proposal_id: p.id,
        client_id: sessionUserId,
        creative_id: p.creative_id,
        status: "active",
      })
      .select("id")
      .single();

    if (cErr) {
      await supabase
        .from("proposals")
        .update({ status: "submitted" })
        .eq("id", p.id);

      setPErr(cErr.message);
      setAcceptingId(null);
      return;
    }

    const { error: jErr } = await supabase
      .from("jobs")
      .update({ status: "hired" })
      .eq("id", job.id);

    if (jErr) {
      setPErr(jErr.message);
    }

    setJob((prev) => (prev ? { ...prev, status: "hired" } : prev));
    setProposals((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, status: "accepted" } : x))
    );

    if (cData?.id) {
      navigate(`/contracts/${cData.id}`);
    }

    setAcceptingId(null);
  }

  const canPropose =
    !!job &&
    !!sessionUserId &&
    job.client_id !== sessionUserId;

  return (
    <div className="space-y-6 text-[var(--text-main)]">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-[var(--text-main)] hover:underline text-sm">
          ← Back to Jobs
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]">
        {loading && <div className="text-[var(--text-muted)]">Loading…</div>}

        {!loading && err && (
          <div className="text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-4">
            {err}
          </div>
        )}

        {!loading && !err && job && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
                {job.title}
              </h1>

              <div className="text-sm text-[var(--text-muted)] mt-1">
                Client: <span className="font-medium">Verified client</span>
              </div>
            </div>

            <div className="text-[var(--text-muted)] whitespace-pre-wrap">
              {job.description}
            </div>

            <div className="flex flex-wrap gap-3 items-center text-sm">
              <div className="px-3 py-1 rounded-full bg-[var(--surface-soft)] border border-[color:var(--border-soft)] text-[var(--text-main)]">
                Budget: LKR {Number(job.budget_min).toLocaleString()}
                {job.budget_max ? ` – ${Number(job.budget_max).toLocaleString()}` : ""}
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--surface-soft)] border border-[color:var(--border-soft)] text-[var(--text-main)]">
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {canPropose ? (
                <button
                  onClick={() => setOpen(true)}
                  className="bg-[var(--accent)] hover:brightness-105 active:brightness-95 text-[#0f140c] px-5 py-3 rounded-lg text-sm font-semibold border border-[color:var(--accent-border)] transition"
                >
                  Submit Proposal
                </button>
              ) : (
                <div className="text-sm text-[var(--text-muted)]">
                  {job.client_id === sessionUserId ? "You posted this job." : "Login required."}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {job && sessionUserId && job.client_id === sessionUserId && (
        <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Proposals</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Review bids and accept one to hire.
              </p>
            </div>
            <div className="text-sm text-[var(--text-muted)]">{proposals.length} total</div>
          </div>

          <div className="mt-4">
            {pLoading && (
              <div className="text-[var(--text-muted)]">Loading proposals…</div>
            )}

            {!pLoading && pErr && (
              <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-3">
                {pErr}
              </div>
            )}

            {!pLoading && !pErr && proposals.length === 0 && (
              <div className="text-[var(--text-muted)]">No proposals yet.</div>
            )}

            {!pLoading && !pErr && proposals.length > 0 && (
              <div className="grid gap-4">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-5"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-main)]">
                          {p.profile?.full_name ?? "Creative"}
                        </div>
                        <div className="text-sm text-[var(--text-muted)] mt-1">
                          {p.delivery_days} days • LKR {Number(p.price).toLocaleString()}
                        </div>
                        <div className="text-[var(--text-muted)] mt-3 whitespace-pre-wrap">
                          {p.message}
                        </div>
                      </div>

                      <div className="shrink-0 text-right space-y-2">
                        <div
                          className={`text-xs px-3 py-1 rounded-full inline-block border ${
                            p.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : p.status === "rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-[var(--surface-soft)] text-[var(--text-main)] border-[color:var(--border-soft)]"
                          }`}
                        >
                          {p.status}
                        </div>

                        {job.status === "open" && p.status !== "accepted" && (
                          <button
                            onClick={() => void acceptProposal(p)}
                            disabled={acceptingId === p.id}
                            className="block w-full px-4 py-2 rounded-lg bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] font-semibold hover:brightness-105 active:brightness-95 disabled:opacity-60"
                          >
                            {acceptingId === p.id ? "Accepting…" : "Accept"}
                          </button>
                        )}

                        {p.status === "accepted" && (
                          <div className="text-sm text-[var(--text-muted)]">Hired ✅</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[color:var(--border-soft)] p-6 text-[var(--text-main)] backdrop-blur-2xl shadow-[var(--card-shadow)]"
            style={{ backgroundImage: "var(--panel-surface-strong)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[var(--text-main)]">
                  Submit proposal
                </div>
                <div className="text-sm text-[var(--text-muted)] mt-1">
                  Your message + price + timeline.
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Price (LKR)
                  </label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                    placeholder="e.g. 20000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Delivery (days)
                  </label>
                  <input
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-main)]">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                  placeholder="Explain your approach + what’s included."
                />
              </div>

              {proposalMsg && (
                <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-3">
                  {proposalMsg}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[color:var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--surface-soft)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void submitProposal()}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] font-semibold hover:brightness-105 active:brightness-95 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send Proposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!mounted) return;

      if (!session) {
        const next = encodeURIComponent(window.location.pathname);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }

      setChecking(false);
    }

    void check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        const next = encodeURIComponent(window.location.pathname);
        navigate(`/login?next=${next}`, { replace: true });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return <div className="p-8 text-[var(--text-muted)]">Checking login…</div>;
  }

  return <>{children}</>;
}

function ContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      if (!uid) {
        const next = encodeURIComponent(`/contracts/${id ?? ""}`);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }

      setSessionUserId(uid);

      if (!id) {
        setErr("Missing contract id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      const { data: c, error: cErr } = await supabase
        .from("contracts")
        .select(
          "id,job_id,proposal_id,client_id,creative_id,status,started_at,delivered_at,completed_at"
        )
        .eq("id", id)
        .single();

      if (cErr) {
        setErr(cErr.message);
        setLoading(false);
        return;
      }

      if (c.client_id !== uid && c.creative_id !== uid) {
        setErr("You don’t have access to this contract.");
        setLoading(false);
        return;
      }

      setContract(c as Contract);

      const { data: m, error: mErr } = await supabase
        .from("messages")
        .select("id,contract_id,sender_id,content,created_at")
        .eq("contract_id", id)
        .order("created_at", { ascending: true });

      if (mErr) {
        setErr(mErr.message);
      } else {
        setMessages((m ?? []) as ContractMessage[]);
      }

      setLoading(false);

      const channel = supabase
        .channel(`contract:${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `contract_id=eq.${id}`,
          },
          (payload) => {
            const newMsg = payload.new as ContractMessage;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    })();
  }, [id, navigate]);

  const isClient = !!contract && !!sessionUserId && contract.client_id === sessionUserId;
  const isCreative = !!contract && !!sessionUserId && contract.creative_id === sessionUserId;

  async function sendMessage() {
    if (!contract || !sessionUserId) return;
    const content = text.trim();
    if (!content) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      contract_id: contract.id,
      sender_id: sessionUserId,
      content,
    });

    setSending(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setText("");
  }

  async function markDelivered() {
    if (!contract || !isCreative) return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("contracts")
      .update({ status: "delivered", delivered_at: now })
      .eq("id", contract.id);

    if (error) return setErr(error.message);

    setContract({ ...contract, status: "delivered", delivered_at: now });
  }

  async function markCompleted() {
    if (!contract || !isClient) return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("contracts")
      .update({ status: "completed", completed_at: now })
      .eq("id", contract.id);

    if (error) return setErr(error.message);

    setContract({ ...contract, status: "completed", completed_at: now });
  }

  return (
    <div className="space-y-6 text-[var(--text-main)]">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-[var(--text-main)] hover:underline text-sm">
          ← Back to Jobs
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-6 backdrop-blur-xl shadow-[var(--card-shadow)]">
        {loading && <div className="text-[var(--text-muted)]">Loading…</div>}

        {!loading && err && (
          <div className="text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl p-4">
            {err}
          </div>
        )}

        {!loading && !err && contract && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--text-muted)]">Contract</div>
              <div className="text-xl font-semibold text-[var(--text-main)]">
                #{contract.id.slice(0, 8)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-soft)] text-[var(--text-main)]">
                {contract.status}
              </span>

              {isCreative && contract.status === "active" && (
                <button
                  onClick={() => void markDelivered()}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] font-semibold hover:brightness-105 active:brightness-95"
                >
                  Mark Delivered
                </button>
              )}

              {isClient && contract.status === "delivered" && (
                <button
                  onClick={() => void markCompleted()}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] font-semibold hover:brightness-105 active:brightness-95"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-0 overflow-hidden backdrop-blur-xl shadow-[var(--card-shadow)]">
        <div className="px-5 py-4 border-b border-[color:var(--border-soft)]">
          <div className="font-semibold text-[var(--text-main)]">Chat</div>
          <div className="text-sm text-[var(--text-muted)]">
            Only client + hired creative can see this.
          </div>
        </div>

        <div className="max-h-[52vh] overflow-auto p-5 space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === sessionUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 border ${
                    mine
                      ? "bg-[var(--surface-strong)] border-[color:var(--border-soft)] text-[var(--text-main)]"
                      : "bg-[var(--surface-soft)] border-[color:var(--border-soft)] text-[var(--text-main)]"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[11px] mt-1 text-[var(--text-muted)] opacity-80">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-[color:var(--border-soft)] flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={sending}
            className="px-4 py-3 rounded-xl bg-[var(--accent)] text-[#0f140c] border border-[color:var(--accent-border)] font-semibold hover:brightness-105 active:brightness-95 disabled:opacity-60"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </section>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <JobsPage /> },
      { path: "dashboard", element: <RequireAuth><Dashboard /></RequireAuth> },
      { path: "workspace", element: <RequireAuth><Workspace /></RequireAuth> },
      { path: "workspace/settings", element: <RequireAuth><WorkspaceSettings /></RequireAuth> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "jobs/:id", element: <RequireAuth><JobDetailsPage /></RequireAuth> },
      { path: "contracts/:id", element: <RequireAuth><ContractPage /></RequireAuth> },
      { path: "profile", element: <RequireAuth><Profile /></RequireAuth> },
      { path: "post-job", element: <RequireAuth><PostJob /></RequireAuth> },
    ],
  },
]);