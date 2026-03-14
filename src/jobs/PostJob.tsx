import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const panelClass =
  "rounded-2xl border border-[color:var(--border-soft)] backdrop-blur-xl shadow-[var(--card-shadow)]";

const inputClass =
  "mt-2 w-full rounded-xl border border-[color:var(--border-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] placeholder:text-[var(--text-faint)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

export default function PostJob() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setMsg("Please log in first.");
      return;
    }

    const min = Number(budgetMin);
    const max = budgetMax.trim() === "" ? null : Number(budgetMax);

    if (!title.trim()) return setMsg("Title is required.");
    if (!description.trim()) return setMsg("Description is required.");
    if (!Number.isFinite(min) || min <= 0) return setMsg("Budget min must be > 0.");
    if (max !== null && (!Number.isFinite(max) || max < min)) {
      return setMsg("Budget max must be >= budget min.");
    }

    setLoading(true);

    const { error } = await supabase.from("jobs").insert({
      client_id: userId,
      title: title.trim(),
      description: description.trim(),
      budget_min: min,
      budget_max: max,
      status: "open",
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    navigate("/");
  }

  return (
    <div className="space-y-6 px-1 text-[var(--text-main)] md:px-0">
      <section
        className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] backdrop-blur-xl shadow-[var(--card-shadow)]"
        style={{ backgroundImage: "var(--panel-surface-strong)" }}
      >
        <div className="px-6 py-10 md:px-8 md:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-main)]">
            Post a Job
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            Share what you need. Creatives will send proposals.
          </p>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className={`${panelClass} max-w-2xl p-5 md:p-6`}
        style={{ backgroundImage: "var(--panel-surface)" }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-main)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wedding photo editing (100 images)"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-main)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the deliverables, style, deadline, and any reference links."
              rows={6}
              className={`${inputClass} min-h-[160px] resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Budget min (LKR)
              </label>
              <input
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 15000"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-main)]">
                Budget max (optional)
              </label>
              <input
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 25000"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-[color:var(--accent-border)] bg-[var(--accent)] px-5 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95 disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Posting…" : "Post Job"}
          </button>

          {msg && (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
              {msg}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}