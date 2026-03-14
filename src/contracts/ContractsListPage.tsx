import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Contract = {
  id: string;
  job_id: string;
  client_id: string;
  creative_id: string;
  status: string;
  started_at: string;
};

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setErr("Not logged in");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("contracts")
      .select("id,job_id,client_id,creative_id,status,started_at")
      .or(`client_id.eq.${uid},creative_id.eq.${uid}`)
      .order("started_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setContracts([]);
    } else {
      setContracts(data ?? []);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0e1a24]">
          My Contracts
        </h1>
        <p className="text-sm text-[#222222]/60">
          Active and past contracts.
        </p>
      </div>

      <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
        {loading && <div className="text-[#222222]/60">Loading…</div>}

        {!loading && err && (
          <div className="text-red-600">{err}</div>
        )}

        {!loading && !err && contracts.length === 0 && (
          <div className="text-[#222222]/60">
            No contracts yet.
          </div>
        )}

        {!loading && !err && contracts.length > 0 && (
          <div className="grid gap-4">
            {contracts.map((c) => (
              <Link
                key={c.id}
                to={`/contracts/${c.id}`}
                className="block rounded-xl border border-black/[0.06] p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-[#0e1a24]">
                    Contract #{c.id.slice(0, 8)}
                  </div>
                  <div className="text-sm px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.06] text-[#222222]/70">
                    {c.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}