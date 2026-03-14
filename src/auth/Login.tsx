import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, bounce to home
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) nav("/", { replace: true });
    })();
  }, [nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setMsg("Logged in ✅");
    setLoading(false);
    nav("/", { replace: true });
  }

  async function sendMagicLink() {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setMsg("Magic link sent. Check your email ✉️");
    setLoading(false);
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-black/[0.08] bg-white shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0e1a24]">
              Log in to Craftly
            </h1>
            <p className="text-sm text-[#222222]/60 mt-1">
              Post jobs, manage your profile, and hire creatives.
            </p>
          </div>

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#222222]">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@gmail.com"
                className="mt-1 w-full rounded-xl border border-black/[0.12] px-3 py-2 outline-none focus:ring-2 focus:ring-[#478391]/30"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#222222]">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-black/[0.12] px-3 py-2 outline-none focus:ring-2 focus:ring-[#478391]/30"
                required
              />
            </div>

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {msg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#d97706] px-4 py-2.5 font-semibold text-white hover:brightness-95 active:brightness-90 disabled:opacity-60"
              type="submit"
            >
              {loading ? "Logging in…" : "Log In"}
            </button>

            <button
              type="button"
              disabled={loading || !email}
              onClick={() => void sendMagicLink()}
              className="w-full rounded-xl border border-black/[0.10] bg-white px-4 py-2.5 font-semibold text-[#0e1a24] hover:bg-black/[0.03] disabled:opacity-50"
              title={!email ? "Enter your email first" : "Send magic link"}
            >
              Send Magic Link
            </button>

            <div className="pt-2 text-center text-sm text-[#222222]/70">
              Back to{" "}
              <Link to="/" className="font-semibold text-[#478391]">
                Jobs
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-2xl bg-[#0e1a24] text-white p-5">
          <div className="text-sm text-white/70">Tip</div>
          <div className="mt-1 font-semibold">
            If you haven’t created a user yet, make one in Supabase → Auth → Users.
          </div>
        </div>
      </div>
    </div>
  );
}