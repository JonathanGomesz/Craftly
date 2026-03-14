import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const panelClass =
  "rounded-2xl border border-[color:var(--border-soft)] backdrop-blur-xl shadow-[var(--card-shadow)]";

const inputClass =
  "w-full rounded-xl border border-[color:var(--border-soft)] px-4 py-3 text-[var(--text-main)] outline-none shadow-[var(--card-shadow-soft)] placeholder:text-[var(--text-faint)] focus:ring-2 focus:ring-[color:var(--accent-soft)]";

const textareaClass = `${inputClass} min-h-[120px] resize-y`;

const badgeClass =
  "inline-flex items-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--text-main)] opacity-90";

const extraCardClass =
  "rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] p-4 shadow-[var(--card-shadow-soft)]";

const EXTRA_PROFILE_KEY = "craftly_profile_extras_v1";

type ProfileExtras = {
  headline: string;
  location: string;
  hourlyRate: string;
  experienceLevel: "entry" | "intermediate" | "expert";
  availability: string;
  primaryService: string;
  skills: string;
  languages: string;
  tools: string;
  website: string;
  instagram: string;
};

const defaultExtras: ProfileExtras = {
  headline: "",
  location: "",
  hourlyRate: "",
  experienceLevel: "intermediate",
  availability: "Available for freelance",
  primaryService: "",
  skills: "",
  languages: "",
  tools: "",
  website: "",
  instagram: "",
};

function loadSavedExtras(userId: string): ProfileExtras {
  try {
    const raw = window.localStorage.getItem(`${EXTRA_PROFILE_KEY}:${userId}`);
    if (!raw) return defaultExtras;
    const parsed = JSON.parse(raw) as Partial<ProfileExtras>;
    return {
      ...defaultExtras,
      ...parsed,
    };
  } catch {
    return defaultExtras;
  }
}

export default function Profile() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [accountType, setAccountType] = useState("creative");
  const [msg, setMsg] = useState<string | null>(null);

  const [headline, setHeadline] = useState(defaultExtras.headline);
  const [location, setLocation] = useState(defaultExtras.location);
  const [hourlyRate, setHourlyRate] = useState(defaultExtras.hourlyRate);
  const [experienceLevel, setExperienceLevel] =
    useState<ProfileExtras["experienceLevel"]>(defaultExtras.experienceLevel);
  const [availability, setAvailability] = useState(defaultExtras.availability);
  const [primaryService, setPrimaryService] = useState(defaultExtras.primaryService);
  const [skills, setSkills] = useState(defaultExtras.skills);
  const [languages, setLanguages] = useState(defaultExtras.languages);
  const [tools, setTools] = useState(defaultExtras.tools);
  const [website, setWebsite] = useState(defaultExtras.website);
  const [instagram, setInstagram] = useState(defaultExtras.instagram);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      if (s) void loadProfile(s.user.id);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) void loadProfile(s.user.id);
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setBio(data.bio || "");
      setAccountType(data.account_type);
    }

    const extras = loadSavedExtras(userId);
    setHeadline(extras.headline);
    setLocation(extras.location);
    setHourlyRate(extras.hourlyRate);
    setExperienceLevel(extras.experienceLevel);
    setAvailability(extras.availability);
    setPrimaryService(extras.primaryService);
    setSkills(extras.skills);
    setLanguages(extras.languages);
    setTools(extras.tools);
    setWebsite(extras.website);
    setInstagram(extras.instagram);
  }

  async function saveProfile() {
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        account_type: accountType,
      })
      .eq("id", session.user.id);

    if (error) {
      setMsg(error.message);
      return;
    }

    const extras: ProfileExtras = {
      headline,
      location,
      hourlyRate,
      experienceLevel,
      availability,
      primaryService,
      skills,
      languages,
      tools,
      website,
      instagram,
    };

    window.localStorage.setItem(
      `${EXTRA_PROFILE_KEY}:${session.user.id}`,
      JSON.stringify(extras)
    );

    setMsg("Profile updated ✅ Extra profile details are saved on this device for now.");
  }

  const skillList = useMemo(
    () =>
      skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [skills]
  );

  const languageList = useMemo(
    () =>
      languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [languages]
  );

  const toolList = useMemo(
    () =>
      tools
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [tools]
  );

  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`${panelClass} max-w-md w-full p-6 text-center`} style={{ backgroundImage: "var(--panel-surface)" }}>
          <div className="text-xl font-semibold text-[var(--text-main)]">Loading…</div>
          <div className="mt-2 text-[var(--text-muted)]">Checking your session.</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`${panelClass} max-w-md w-full p-6 text-center`} style={{ backgroundImage: "var(--panel-surface)" }}>
          <div className="text-xl font-semibold text-[var(--text-main)]">Please log in</div>
          <div className="mt-2 text-[var(--text-muted)]">
            You need to be signed in to edit your profile.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 text-[var(--text-main)] md:px-0">
      <div className={`${panelClass} overflow-hidden`} style={{ backgroundImage: "var(--panel-surface)" }}>
        <div className="border-b border-[color:var(--border-soft)] px-6 py-6 md:px-8" style={{ backgroundImage: "var(--panel-surface-strong)" }}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Creative Profile
              </div>
              <h1 className="mt-2 text-3xl font-bold text-[var(--text-main)]">
                {fullName || "Your Profile"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                Build a stronger public-facing profile with more depth — headline,
                services, tools, skills, languages, and links.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {availability && <span className={badgeClass}>{availability}</span>}
                {primaryService && <span className={badgeClass}>{primaryService}</span>}
                {hourlyRate && <span className={badgeClass}>LKR {hourlyRate}/hr</span>}
                <span className={badgeClass}>{accountType}</span>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 md:max-w-md">
              <div className={extraCardClass}>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Experience
                </div>
                <div className="mt-2 text-sm font-semibold capitalize text-[var(--text-main)]">
                  {experienceLevel}
                </div>
              </div>
              <div className={extraCardClass}>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Location
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                  {location || "Add location"}
                </div>
              </div>
              <div className={extraCardClass}>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Skills
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                  {skillList.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1.35fr_0.85fr] md:p-8">
          <div className="space-y-6">
            <div className={extraCardClass}>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Core Identity</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                The main stuff clients should see first.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Full Name
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Headline
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Wedding Retoucher • Graphic Designer • Photo Editor"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Location
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Negombo, Sri Lanka"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Hourly Rate
                  </label>
                  <input
                    className={inputClass}
                    placeholder="5000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Account Type
                  </label>
                  <select
                    className={inputClass}
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                  >
                    <option value="client" className="text-black">
                      Client
                    </option>
                    <option value="creative" className="text-black">
                      Creative
                    </option>
                    <option value="both" className="text-black">
                      Both
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Experience Level
                  </label>
                  <select
                    className={inputClass}
                    value={experienceLevel}
                    onChange={(e) =>
                      setExperienceLevel(
                        e.target.value as ProfileExtras["experienceLevel"]
                      )
                    }
                  >
                    <option value="entry" className="text-black">
                      Entry level
                    </option>
                    <option value="intermediate" className="text-black">
                      Intermediate
                    </option>
                    <option value="expert" className="text-black">
                      Expert
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Availability
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Available for freelance"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Primary Service
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Photo Retouching"
                    value={primaryService}
                    onChange={(e) => setPrimaryService(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={extraCardClass}>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">About You</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Give clients a proper reason to trust your work.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Bio
                  </label>
                  <textarea
                    className={textareaClass}
                    placeholder="Short Bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Skills
                  </label>
                  <input
                    className={inputClass}
                    placeholder="High-end retouching, skin cleanup, color grading, album design"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    Separate with commas.
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Tools
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Photoshop, Lightroom, Premiere Pro, Illustrator"
                    value={tools}
                    onChange={(e) => setTools(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Languages
                  </label>
                  <input
                    className={inputClass}
                    placeholder="English, Sinhala"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={extraCardClass}>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Links</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Add places where people can verify your brand and work.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Website / Portfolio
                  </label>
                  <input
                    className={inputClass}
                    placeholder="https://yourportfolio.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Instagram
                  </label>
                  <input
                    className={inputClass}
                    placeholder="https://instagram.com/yourhandle"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={extraCardClass}>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Live Preview</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Rough preview of how your profile feels.
              </p>

              <div className="mt-4 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-strong)] p-5">
                <div className="text-2xl font-bold text-[var(--text-main)]">
                  {fullName || "Your name"}
                </div>
                <div className="mt-2 text-base font-medium text-[var(--text-main)] opacity-90">
                  {headline || "Your headline goes here"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--text-muted)]">
                  {location && <span>{location}</span>}
                  {location && hourlyRate && <span>•</span>}
                  {hourlyRate && <span>LKR {hourlyRate}/hr</span>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {availability && <span className={badgeClass}>{availability}</span>}
                  {primaryService && <span className={badgeClass}>{primaryService}</span>}
                  <span className={badgeClass}>{experienceLevel}</span>
                </div>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[var(--text-main)] opacity-80">
                  {bio || "Your bio will show here once you add it."}
                </p>
              </div>
            </div>

            <div className={extraCardClass}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Skills Snapshot
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {skillList.length > 0 ? (
                  skillList.map((skill) => (
                    <span key={skill} className={badgeClass}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-[var(--text-muted)]">No skills added yet.</div>
                )}
              </div>
            </div>

            <div className={extraCardClass}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Tools
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {toolList.length > 0 ? (
                  toolList.map((tool) => (
                    <span key={tool} className={badgeClass}>
                      {tool}
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-[var(--text-muted)]">No tools added yet.</div>
                )}
              </div>
            </div>

            <div className={extraCardClass}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Languages
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {languageList.length > 0 ? (
                  languageList.map((language) => (
                    <span key={language} className={badgeClass}>
                      {language}
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-[var(--text-muted)]">No languages added yet.</div>
                )}
              </div>
            </div>

            <div className={extraCardClass}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Quick Links
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="text-[var(--text-main)] opacity-90">
                  Website: {website || "Not added"}
                </div>
                <div className="text-[var(--text-main)] opacity-90">
                  Instagram: {instagram || "Not added"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--border-soft)] px-6 py-5 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-[var(--text-muted)]">
              Core profile fields save to Supabase. Extra profile fields in this screen are
              currently saved on this device only.
            </div>

            <button
              onClick={() => void saveProfile()}
              className="w-full rounded-xl border border-[color:var(--accent-border)] bg-[var(--accent)] px-4 py-3 font-semibold text-[#0f140c] transition hover:brightness-105 active:brightness-95 md:w-auto"
            >
              Save Profile
            </button>
          </div>

          {msg && (
            <div className="mt-4 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-main)] opacity-90">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}