"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";
import { parseDateOnly } from "@/lib/utils";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[13px]" style={{ color: "var(--w-soft-text)" }}>{children}</span>;
}

export function EnquiryForm({ board, onDone }: { board: PublicBoard; onDone?: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [from, setFrom] = useState("");
  const [till, setTill] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const days =
    from && till
      ? Math.round((parseDateOnly(till).getTime() - parseDateOnly(from).getTime()) / 86_400_000) + 1
      : null;
  const datesOk = !from || !till || (days !== null && days > 0);

  const valid =
    companyName.trim().length >= 2 &&
    contactPerson.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 8 &&
    datesOk;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        boardCode: board.code, companyName, contactPerson, phone, email, message,
        startDate: from || null,
        durationDays: days,
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setError(d.error ?? "Could not send that."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <span
          className="mx-auto grid size-12 place-items-center rounded-full"
          style={{ background: "var(--w-free-tint)" }}
        >
          <Check className="size-6" strokeWidth={2.6} style={{ color: "var(--w-free)" }} />
        </span>
        <h3 className="mt-4 text-[19px] font-[650]" style={{ color: "var(--w-text)" }}>Enquiry sent</h3>
        <p className="mt-1.5 text-[14px]" style={{ color: "var(--w-soft-text)" }}>
          We&rsquo;ll call you about {board.code}.
        </p>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-5 rounded-full border px-5 py-2.5 text-[14px] font-[600]"
            style={{ borderColor: "var(--w-line)", color: "var(--w-mid)" }}
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
        <input className="w-field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <Label>Your name</Label>
          <input className="w-field" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <Label>Phone</Label>
          <input className="w-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91" />
        </label>
      </div>

      <label className="block">
        <Label>Email <span style={{ color: "var(--w-faint)" }}>(optional)</span></Label>
        <input className="w-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block min-w-0">
          <Label>From</Label>
          <input className="w-field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <Label>Till</Label>
          <input className="w-field" type="date" value={till} onChange={(e) => setTill(e.target.value)} />
        </label>
      </div>
      {from && till && (
        <p className="-mt-2 text-[13px]" style={{ color: datesOk ? "var(--w-soft-text)" : "var(--w-warn)" }}>
          {datesOk ? `${days} days` : "Till must come after From"}
        </p>
      )}

      <label className="block">
        <Label>Message <span style={{ color: "var(--w-faint)" }}>(optional)</span></Label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-field"
          style={{ height: "auto", padding: "12px 14px" }}
        />
      </label>

      {error && <p className="text-[14px]" style={{ color: "var(--w-warn)" }}>{error}</p>}

      <button
        type="submit"
        disabled={!valid || busy}
        className="h-12 w-full rounded-full text-[16px] font-[600] text-white transition-opacity disabled:opacity-40"
        style={{ background: "var(--w-accent)" }}
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
