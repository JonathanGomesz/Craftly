import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

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

type Message = {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ContractPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isClient = useMemo(
    () => !!contract && !!sessionUserId && contract.client_id === sessionUserId,
    [contract, sessionUserId]
  );
  const isCreative = useMemo(
    () => !!contract && !!sessionUserId && contract.creative_id === sessionUserId,
    [contract, sessionUserId]
  );

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      if (!uid) {
        const next = encodeURIComponent(`/contracts/${id ?? ""}`);
        nav(`/login?next=${next}`, { replace: true });
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
        .select("id,job_id,proposal_id,client_id,creative_id,status,started_at,delivered_at,completed_at")
        .eq("id", id)
        .single();

      if (cErr) {
        setErr(cErr.message);
        setLoading(false);
        return;
      }

      // RLS should protect, but we still handle UI nicely
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
        setMessages((m ?? []) as Message[]);
      }

      setLoading(false);

      // realtime (optional, but nice)
      const channel = supabase
        .channel(`contract:${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `contract_id=eq.${id}` },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    })();
  }, [id, nav]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

    const { error } = await supabase
      .from("contracts")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", contract.id);

    if (error) return setErr(error.message);
    setContract({ ...contract, status: "delivered", delivered_at: new Date().toISOString() });
  }

  async function markCompleted() {
    if (!contract || !isClient) return;

    const { error } = await supabase
      .from("contracts")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", contract.id);

    if (error) return setErr(error.message);
    setContract({ ...contract, status: "completed", completed_at: new Date().toISOString() });
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
        {loading && <div className="text-[#222222]/60">Loading…</div>}
        {!loading && err && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
            {err}
          </div>
        )}

        {!loading && !err && contract && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-[#222222]/60">Contract</div>
              <div className="text-xl font-semibold text-[#0e1a24]">
                #{contract.id.slice(0, 8)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full border border-black/[0.08] bg-black/[0.04] text-[#222222]/70">
                {contract.status}
              </span>

              {isCreative && contract.status === "active" && (
                <button
                  onClick={() => void markDelivered()}
                  className="px-4 py-2 rounded-lg bg-[#d97706] text-white font-semibold hover:brightness-95 active:brightness-90"
                >
                  Mark Delivered
                </button>
              )}

              {isClient && contract.status === "delivered" && (
                <button
                  onClick={() => void markCompleted()}
                  className="px-4 py-2 rounded-lg bg-[#d97706] text-white font-semibold hover:brightness-95 active:brightness-90"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border border-black/[0.06] rounded-2xl p-0 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <div className="font-semibold text-[#0e1a24]">Chat</div>
          <div className="text-sm text-[#222222]/60">
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
                      ? "bg-[#d97706]/10 border-[#d97706]/20 text-[#0e1a24]"
                      : "bg-black/[0.03] border-black/[0.06] text-[#222222]"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[11px] mt-1 text-[#222222]/50">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-black/[0.06] flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-black/[0.10] px-4 py-3 outline-none focus:ring-2 focus:ring-[#478391]/30"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={sending}
            className="px-4 py-3 rounded-xl bg-[#d97706] text-white font-semibold hover:brightness-95 active:brightness-90 disabled:opacity-60"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </section>
    </div>
  );
}