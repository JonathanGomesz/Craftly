import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Job = {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number | null;
  created_at: string;
};

const ACCENT = "var(--accent)";

const panelClass =
  "rounded-[30px] border border-[color:var(--border-soft)] backdrop-blur-2xl shadow-[var(--card-shadow)]";

const cardClass =
  "group relative overflow-hidden rounded-[26px] border border-[color:var(--border-soft)] p-5 backdrop-blur-xl shadow-[var(--card-shadow-soft)] transition duration-200 hover:-translate-y-[2px] hover:border-[color:var(--accent-soft)] hover:shadow-[0_18px_48px_rgba(0,0,0,0.28),0_0_0_1px_var(--accent-ring)]";

const primaryButtonClass =
  "rounded-xl border px-4 py-2.5 text-sm font-semibold text-[#11150f] shadow-[0_10px_28px_rgba(143,209,79,0.18)] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:brightness-95";

export default function Jobs() {
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
      .select("id,title,description,budget_min,budget_max,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    setJobs(data ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-8 text-[var(--text-main)]">
      <section
        className="relative overflow-hidden rounded-[34px] border border-[color:var(--border-soft)] backdrop-blur-2xl shadow-[var(--card-shadow-strong)]"
        style={{ backgroundImage: "var(--panel-surface-strong)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-10 top-8 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--glow-navy-strong)" }}
          />
          <div
            className="absolute right-[8%] top-[12%] h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--glow-accent-soft)" }}
          />
          <div
            className="absolute right-0 top-0 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--glow-cream-soft)" }}
          />
          <div
            className="absolute left-[22%] bottom-[-20%] h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--glow-navy-soft)" }}
          />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--border-strong)] to-transparent" />
        </div>

        <div className="relative px-8 py-14 md:px-10">
          <span
            className="inline-flex items-center rounded-full border border-[color:var(--accent-soft)] px-4 py-2 text-sm text-[var(--text-main)] opacity-90 shadow-[0_8px_24px_rgba(0,0,0,0.16),0_0_0_1px_var(--accent-ring)]"
            style={{ backgroundColor: "var(--surface-soft)" }}
          >
            Sri Lanka’s Creative Hiring Platform
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--text-main)] md:text-5xl">
            Hire top creatives. <span style={{ color: ACCENT }}>Fast.</span>
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">
            Post a job, receive proposals from verified photographers, designers,
            editors, and videographers — then hire with confidence.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/post-job"
              className={primaryButtonClass}
              style={{
                backgroundColor: ACCENT,
                borderColor: "var(--accent-border)",
                boxShadow:
                  "0 0 0 1px var(--accent-ring), 0 14px 34px var(--accent-glow-soft)",
              }}
            >
              Post a Job
            </Link>

            <button
              onClick={() => window.scrollTo({ top: 700, behavior: "smooth" })}
              className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] transition hover:border-[color:var(--accent-soft)]"
              style={{ backgroundColor: "var(--surface-soft)" }}
            >
              Browse Latest Jobs
            </button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Fast hiring", "Proposals"],
              ["Trusted profiles", "Portfolios"],
              ["Transparent", "Budgets"],
            ].map(([kicker, label]) => (
              <div
                key={label}
                className="rounded-[24px] border border-[color:var(--border-soft)] p-5 backdrop-blur-xl shadow-[var(--card-shadow-soft)]"
                style={{ backgroundColor: "var(--surface-soft)" }}
              >
                <div className="text-sm text-[var(--text-muted)]">{kicker}</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">
              Open Jobs
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Browse the latest jobs posted by clients.
            </p>
          </div>

          <button
            onClick={() => void loadJobs()}
            className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-main)] transition hover:border-[color:var(--accent-soft)] hover:bg-[color:var(--surface-hover)]"
          >
            Refresh
          </button>
        </div>

        <div
          className={`${panelClass} p-5 md:p-6`}
          style={{ backgroundImage: "var(--panel-surface)" }}
        >
          {loading && <div className="text-[var(--text-muted)]">Loading…</div>}

          {!loading && err && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
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
                  className={cardClass}
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--accent), transparent)",
                    }}
                  />

                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="text-[1.65rem] font-semibold leading-tight text-[var(--text-main)] transition-colors duration-200 group-hover:text-[var(--text-main)]">
                        {job.title}
                      </div>
                      <div className="mt-2 text-[var(--text-muted)]">
                        {job.description}
                      </div>
                    </div>

                    <div className="shrink-0 text-left md:text-right">
                      <div className="text-base font-semibold text-[var(--text-main)]">
                        LKR {Number(job.budget_min).toLocaleString()}
                        {job.budget_max
                          ? ` – ${Number(job.budget_max).toLocaleString()}`
                          : ""}
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-muted)] opacity-80">
                        {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Link
                      to={`/jobs/${job.id}`}
                      className={primaryButtonClass}
                      style={{
                        backgroundColor: ACCENT,
                        borderColor: "var(--accent-border)",
                        boxShadow:
                          "0 0 0 1px var(--accent-ring), 0 10px 26px var(--accent-glow-soft)",
                      }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}