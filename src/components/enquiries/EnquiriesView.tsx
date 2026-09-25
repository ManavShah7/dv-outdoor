"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Send, X } from "lucide-react";
import type { Enquiry, RequestStatus } from "@/lib/enquiries.db";
import { cn } from "@/lib/utils";

/**
 * The lead desk.
 *
 * An enquiry arrives from the public site, lands here, and is worked until it
 * is a booking or it is not. Replies go out from here rather than from
 * somebody's personal inbox, so the answer stays attached to the enquiry and
 * the next person to open it can see it was handled.
 */

const FLOW: { id: RequestStatus; label: string; tone: string }[] = [
  { id: "new", label: "New", tone: "var(--color-sev-red)" },
  { id: "contacted", label: "Contacted", tone: "var(--color-sev-orange)" },
  { id: "negotiating", label: "Negotiating", tone: "var(--color-sev-yellow)" },
  { id: "converted", label: "Converted", tone: "var(--color-available)" },
  { id: "declined", label: "Declined", tone: "var(--color-ink-500)" },
  { id: "lost", label: "Lost", tone: "var(--color-ink-500)" },
];
const toneOf = (s: RequestStatus) => FLOW.find((f) => f.id === s)?.tone ?? "var(--color-ink-500)";
const labelOf = (s: RequestStatus) => FLOW.find((f) => f.id === s)?.label ?? s;

function ago(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Detail({ e, onClose }: { e: Enquiry; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState(
    e.board
      ? `Hello ${e.contactPerson},\n\nThank you for your enquiry about ${e.board.code} — ${e.board.name}.\n\n`
      : `Hello ${e.contactPerson},\n\nThank you for your enquiry.\n\n`,
  );
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: e.id, ...body }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => null))?.error ?? "That did not work.");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="flex h-full w-[460px] shrink-0 flex-col overflow-y-auto material-thick border-l border-white/[0.06]">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-6 py-5">
        <div className="min-w-0">
          <p className="text-caption2 uppercase text-ink-500">{ago(e.createdAt)}</p>
          <h2 className="mt-1 truncate text-title3 font-[650] text-ink-0">{e.companyName}</h2>
          <p className="mt-0.5 text-footnote text-ink-400">{e.contactPerson}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="grid size-7 shrink-0 place-items-center rounded-full text-ink-400 hover:text-ink-0">
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-col gap-2 border-b border-white/[0.07] px-6 py-5">
        <a href={`tel:${e.phone}`} className="inline-flex items-center gap-2 text-subhead text-ink-100 hover:text-ink-0">
          <Phone className="size-4 text-ink-500" strokeWidth={2} /> {e.phone}
        </a>
        {e.email ? (
          <a href={`mailto:${e.email}`} className="inline-flex items-center gap-2 text-subhead text-ink-100 hover:text-ink-0">
            <Mail className="size-4 text-ink-500" strokeWidth={2} /> {e.email}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-subhead text-ink-500">
            <Mail className="size-4" strokeWidth={2} /> No email — phone only
          </span>
        )}
      </div>

      {(e.board || e.startDate) && (
        <div className="border-b border-white/[0.07] px-6 py-5">
          {e.board && (
            <>
              <p className="text-caption2 uppercase text-ink-500">Asking about</p>
              <p className="mt-1 text-subhead font-[590] text-ink-0">
                {e.board.code} — {e.board.name}
              </p>
              <p className="text-footnote text-ink-400">{e.board.city}</p>
            </>
          )}
          {e.startDate && (
            <p className="mt-3 text-footnote text-ink-300">
              Wants it from {e.startDate}
              {e.durationDays ? ` for ${e.durationDays} days` : ""}
            </p>
          )}
        </div>
      )}

      {e.message && (
        <div className="border-b border-white/[0.07] px-6 py-5">
          <p className="text-caption2 uppercase text-ink-500">They said</p>
          <p className="mt-2 whitespace-pre-wrap text-subhead leading-relaxed text-ink-100">{e.message}</p>
        </div>
      )}

      <div className="border-b border-white/[0.07] px-6 py-5">
        <p className="text-caption2 uppercase text-ink-500">Where it stands</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLOW.map((f) => (
            <button
              key={f.id}
              disabled={busy}
              onClick={() => post({ action: "set_status", status: f.id, declineReason: note })}
              className={cn(
                "h-9 rounded-[var(--radius-control)] px-3.5 text-footnote font-[590] ring-1 ring-inset transition-colors",
                e.status === f.id ? "text-ink-0" : "text-ink-300 ring-white/[0.1] hover:bg-white/[0.06]",
              )}
              style={e.status === f.id ? { background: f.tone, color: "#0b0e10", boxShadow: "none" } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
        {e.status === "declined" && (
          <input
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            placeholder="Why? (saved with the enquiry)"
            className="mt-3 h-10 w-full rounded-[var(--radius-control)] bg-black/30 px-3 text-footnote text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
          />
        )}
      </div>

      <div className="px-6 py-5">
        <p className="text-caption2 uppercase text-ink-500">Write back</p>
        {sent ? (
          <p className="mt-3 text-subhead text-ink-100">Sent to {e.email}.</p>
        ) : (
          <>
            <textarea
              rows={7}
              value={msg}
              onChange={(ev) => setMsg(ev.target.value)}
              disabled={!e.email}
              className="mt-3 w-full rounded-[var(--radius-card)] bg-black/30 p-3.5 text-subhead leading-relaxed text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.1] ring-inset outline-none focus:ring-2 focus:ring-accent disabled:opacity-40"
            />
            <button
              disabled={busy || !e.email || msg.trim().length < 2}
              onClick={async () => { if (await post({ action: "reply", message: msg })) setSent(true); }}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent text-subhead font-[620] text-accent-on disabled:opacity-35"
            >
              <Send className="size-4" strokeWidth={2.2} />
              {busy ? "Sending" : e.email ? "Send email" : "No email on file"}
            </button>
          </>
        )}
        {err && <p className="mt-3 text-footnote" style={{ color: "var(--color-sev-red)" }}>{err}</p>}
      </div>
    </div>
  );
}

export function EnquiriesView({ enquiries }: { enquiries: Enquiry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [only, setOnly] = useState<RequestStatus | "open" | null>("open");

  const shown = useMemo(() => {
    if (only === "open") return enquiries.filter((e) => !["converted", "declined", "lost"].includes(e.status));
    if (only) return enquiries.filter((e) => e.status === only);
    return enquiries;
  }, [enquiries, only]);

  const open = enquiries.find((e) => e.id === openId) ?? null;
  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-y-auto material-thick">
        <div className="mx-auto max-w-[1000px] px-10 py-9">
          <div className="flex flex-wrap items-center gap-2">
            {([["open", "Open"], ...FLOW.map((f) => [f.id, f.label] as const)] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setOnly(only === id ? null : (id as RequestStatus | "open"))}
                className={cn(
                  "h-9 rounded-[var(--radius-control)] px-4 text-footnote font-[520] ring-1 ring-inset transition-colors",
                  only === id ? "bg-accent text-accent-on ring-transparent" : "bg-black/25 text-ink-200 ring-white/[0.08] hover:bg-white/[0.07]",
                )}
              >
                {label}
                {id === "new" && newCount > 0 ? ` · ${newCount}` : ""}
              </button>
            ))}
            <span className="ml-auto text-footnote tabular-nums text-ink-500">{shown.length} shown</span>
          </div>

          {shown.length === 0 ? (
            <p className="mt-16 text-center text-subhead text-ink-500">Nothing here.</p>
          ) : (
            <div className="mt-6 flex flex-col gap-2">
              {shown.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setOpenId(e.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-[var(--radius-card)] bg-chrome-raised px-5 py-4 text-left ring-1 ring-inset transition-colors",
                    openId === e.id ? "ring-accent" : "ring-white/[0.07] hover:bg-white/[0.05]",
                  )}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: toneOf(e.status) }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-subhead font-[590] text-ink-0">{e.companyName}</span>
                      <span className="shrink-0 text-footnote text-ink-500">{e.contactPerson}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-footnote text-ink-400">
                      {e.board ? `${e.board.code} — ${e.board.name}` : "No specific board"}
                      {e.message ? ` · ${e.message}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-footnote font-[590]" style={{ color: toneOf(e.status) }}>
                      {labelOf(e.status)}
                    </span>
                    <span className="block text-caption tabular-nums text-ink-500">{ago(e.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {open && <Detail e={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
