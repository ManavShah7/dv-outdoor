"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";
import { cn } from "@/lib/utils";

function Input({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-footnote text-ink-400">{label}</span>
      <input
        {...props}
        className="h-11 w-full min-w-0 rounded-[var(--radius-control)] bg-black/30 px-4 text-subhead text-ink-0 placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
      />
      {hint && <span className="mt-1.5 block text-caption text-ink-600">{hint}</span>}
    </label>
  );
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
        boardCode: board.code,
        companyName, contactPerson, phone, email, message,
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
          style={{ background: "color-mix(in srgb, var(--color-available) 16%, transparent)" }}
        >
          <Check className="size-7" strokeWidth={2.6} style={{ color: "var(--color-available)" }} />
        </span>
        <h3 className="mt-5 text-title2 font-[680] text-ink-0">Enquiry sent</h3>
        <p className="mt-2.5 max-w-[34ch] text-body text-ink-300">
          We have your details for {board.code}. Someone from the office will call you
          today.
        </p>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-7 rounded-[var(--radius-pill)] px-6 py-3 text-subhead font-[590] text-ink-200 ring-1 ring-white/[0.12] ring-inset transition-colors hover:bg-white/[0.06]"
          >
            Keep browsing
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Your name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name" />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
      </div>
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Wanted from" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label className="block min-w-0">
          <span className="mb-1.5 block text-footnote text-ink-400">For how long</span>
          <select
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="h-11 w-full min-w-0 appearance-none rounded-[var(--radius-control)] bg-black/30 px-4 text-subhead text-ink-0 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m} className="bg-ink-900">
                {m} month{m > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-footnote text-ink-400">Anything else</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Optional"
          className="w-full rounded-[var(--radius-control)] bg-black/30 p-4 text-subhead text-ink-0 placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      {error && (
        <p className="text-footnote" style={{ color: "var(--color-damaged)" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || busy}
        className={cn(
          "h-12 w-full rounded-[var(--radius-control)] bg-accent text-body font-[620] text-accent-on",
          "transition-opacity disabled:opacity-35",
        )}
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-caption text-ink-600">
        No payment, no commitment — this just starts a conversation.
      </p>
    </form>
  );
}
