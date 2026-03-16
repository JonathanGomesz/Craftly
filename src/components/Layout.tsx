import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const navBase =
  "px-3.5 py-2 rounded-xl font-medium transition-all duration-200 border backdrop-blur-md";

const accent = "#8fd14f";

const primaryCtaClass =
  "rounded-xl border px-4 py-2 font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:brightness-95";

export default function Layout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("craftly-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("craftly-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${navBase} ${
      isActive
        ? "text-[var(--text-main)] border-[var(--accent-border)] bg-[var(--surface-soft)] shadow-[0_10px_26px_var(--accent-glow),0_0_0_1px_var(--accent-ring)]"
        : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)] hover:bg-[var(--surface-soft)] hover:border-[var(--accent-soft)] hover:shadow-[0_8px_22px_var(--accent-glow)]"
    }`;

  return (
    <div
      className="relative min-h-screen overflow-x-clip"
      style={{
        color: "var(--text-main)",
        background: "var(--bg-main)",
        backgroundImage: "var(--bg-gradient)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div
          className="absolute left-[7%] top-[11%] h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--glow-navy-strong)" }}
        />
        <div
          className="absolute right-[10%] top-[14%] h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--glow-accent-soft)" }}
        />
        <div
          className="absolute right-[8%] top-[20%] h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--glow-cream-soft)" }}
        />
        <div
          className="absolute bottom-[8%] left-[20%] h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--glow-navy-soft)" }}
        />
        <div
          className="absolute bottom-[18%] right-[16%] h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--glow-accent-faint)" }}
        />
      </div>

      <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
        <div
          className="mx-auto max-w-7xl rounded-[26px] border px-5 py-3 backdrop-blur-2xl"
          style={{
            borderColor: "var(--border-soft)",
            backgroundColor: "var(--bg-panel)",
            boxShadow: "var(--panel-shadow), 0 0 0 1px var(--accent-ring)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex min-w-0 items-center justify-between gap-3 lg:w-auto lg:shrink-0">
              <Link to="/" className="flex min-w-0 shrink-0 items-center gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="truncate text-lg font-semibold tracking-[0.01em]"
                    style={{ color: "var(--text-main)" }}
                  >
                    Craftly
                  </div>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: accent,
                      boxShadow: "0 0 18px rgba(143,209,79,0.45)",
                    }}
                  />
                </div>
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-4">
              <nav className="grid min-w-0 grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:flex lg:items-center lg:justify-end lg:self-center lg:gap-2">
                <NavLink to="/" end className={navLinkClass}>
                  Jobs
                </NavLink>

                {session && (
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                )}

                {session && (
                  <NavLink to="/workspace" className={navLinkClass}>
                    Workspace
                  </NavLink>
                )}

                {session && (
                  <NavLink to="/profile" className={navLinkClass}>
                    Profile
                  </NavLink>
                )}
              </nav>

              <div className="flex flex-wrap items-center justify-start gap-6 sm:justify-end lg:flex-nowrap lg:self-center">
                {session ? (
                  <NavLink
                    to="/post-job"
                    className={primaryCtaClass}
                    style={{
                      color: "#0f140c",
                      backgroundColor: "var(--accent)",
                      borderColor: "var(--accent-border)",
                      boxShadow:
                        "0 0 0 1px var(--accent-ring), 0 10px 30px var(--accent-glow-soft)",
                    }}
                  >
                    Post a Job
                  </NavLink>
                ) : (
                  <NavLink
                    to="/login?next=%2Fpost-job"
                    className={primaryCtaClass}
                    style={{
                      color: "#0f140c",
                      backgroundColor: "var(--accent)",
                      borderColor: "var(--accent-border)",
                      boxShadow:
                        "0 0 0 1px var(--accent-ring), 0 10px 30px var(--accent-glow-soft)",
                    }}
                  >
                    Log in to post
                  </NavLink>
                )}

                <button
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className="relative h-9 w-[98px] shrink-0 rounded-full border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    borderColor: "var(--accent-soft)",
                    backgroundColor: "var(--surface-soft)",
                    boxShadow: "0 10px 28px var(--accent-glow)",
                  }}
                >
                  <span
                    className="absolute top-1/2 h-7 w-[42px] -translate-y-1/2 rounded-full transition-all duration-300"
                    style={{
                      left: theme === "dark" ? "calc(100% - 46px)" : "4px",
                      backgroundColor: "var(--accent)",
                      boxShadow: "0 8px 22px var(--accent-glow-soft)",
                    }}
                  />

                  <span className="relative z-10 grid h-full w-full grid-cols-2 px-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]">
                    <span
                      className="flex h-full items-center justify-center text-center leading-none pb-[1px]"
                      style={{
                        color: theme === "light" ? "#0f140c" : "var(--text-muted)",
                      }}
                    >
                      LIGHT
                    </span>

                    <span
                      className="flex h-full items-center justify-center text-center leading-none pb-[1px]"
                      style={{
                        color: theme === "dark" ? "#0f140c" : "var(--text-muted)",
                      }}
                    >
                      DARK
                    </span>
                  </span>
                </button>

                {session ? (
                  <button
                    onClick={() => void logout()}
                    className="rounded-xl border px-3 py-2 font-medium transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)]"
                    style={{
                      color: "var(--text-muted)",
                      borderColor: "transparent",
                      backgroundColor: "transparent",
                    }}
                  >
                    Log out
                  </button>
                ) : (
                  <NavLink to="/login" className={navLinkClass}>
                    Log in
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
