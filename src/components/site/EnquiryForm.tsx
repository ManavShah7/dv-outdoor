"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";

const FIELD =
  "h-11 w-full min-w-0 rounded-[var(--radius-control)] bg-black/30 px-4 text-subhead text-ink-0 " +
  "placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-footnote text-ink-400">{children}</span>;
}

export function EnquiryForm({ board, onDone }: { board: PublicBoard; onDone?: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [months, setMonths] = useState("3");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const valid =
    companyName.trim().length >= 2 &&
    contactPerson.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 8;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        boardCode: board.code, companyName, contactPerson, phone, email, message,
        startDate: startDate || null,
        durationDays: Number(months) ? Number(months) * 30 : null,
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setError(d.error ?? "Could not send that."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span
          className="grid size-14 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-available) 15%, transparent)" }}
        >
          <Check className="size-7" strokeWidth={2.6} style={{ color: "var(--color-available)" }} />
        </span>
        <h3 className="mt-5 text-title2 font-[680] text-ink-0">Enquiry sent</h3>
        <p className="mt-2.5 max-w-[34ch] text-subhead leading-relaxed text-ink-400">
          We have your details for {board.code}. Someone from the office will call you today.
        </p>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-7 rounded-[var(--radius-pill)] px-6 py-3 text-subhead font-[590] text-ink-200 ring-1 ring-inset ring-white/[0.12] transition-colors hover:bg-white/[0.06]"
          >
            Keep browsing
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="block">
        <Label>Company</Label>
        <input className={FIELD} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <Label>Your name</Label>
          <input className={FIELD} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name" />
        </label>
        <label className="block min-w-0">
          <Label>Phone</Label>
          <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
        </label>
      </div>
      <label className="block">
        <Label>Email</Label>
        <input className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <Label>Wanted from</Label>
          <input className={FIELD} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <Label>For how long</Label>
          <select
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className={FIELD + " appearance-none"}
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m} className="bg-ink-900 text-ink-0">
                {m} month{m > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <Label>Anything else</Label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-[var(--radius-control)] bg-black/30 p-4 text-subhead text-ink-0 placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      {error && <p className="text-footnote" style={{ color: "var(--color-damaged)" }}>{error}</p>}

      <button
        type="submit"
        disabled={!valid || busy}
        className="h-12 w-full rounded-[var(--radius-pill)] bg-accent text-body font-[620] text-accent-on transition-opacity disabled:opacity-35"
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-caption text-ink-600">
        No payment, no commitment — this just starts a conversation.
      </p>
    </form>
  );
}
