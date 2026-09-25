"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";
import { parseDateOnly } from "@/lib/utils";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="tmui-lab">{children}</span>;
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
        <span className="mx-auto grid size-11 place-items-center"
              style={{ background: "var(--ink)", color: "var(--paper)" }}>
          <Check className="size-5" strokeWidth={3} />
        </span>
        <h3 className="tmui-caps mt-4" style={{ fontSize: 15, fontWeight: 700 }}>Enquiry sent</h3>
        <p className="tmui-note mt-2" style={{ opacity: .65 }}>
          We&rsquo;ll call you about {board.code}.
        </p>
        {onDone && (
          <button onClick={onDone} className="tmui-ghost mt-5">Keep browsing</button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="tmui-form">
      <label className="block">
        <Label>Company</Label>
        <input className="tmui-in" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </label>

      <div className="tmui-row">
        <label className="block min-w-0">
          <Label>Your name</Label>
          <input className="tmui-in" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <Label>Phone</Label>
          <input className="tmui-in" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91" />
        </label>
      </div>

      <label className="block">
        <Label>Email <span style={{ color: "var(--w-faint)" }}>(optional)</span></Label>
        <input className="tmui-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <div className="tmui-row">
        <label className="block min-w-0">
          <Label>From</Label>
          <input className="tmui-in" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <Label>Till</Label>
          <input className="tmui-in" type="date" value={till} onChange={(e) => setTill(e.target.value)} />
        </label>
      </div>
      {from && till && (
        <p className="tmui-note -mt-1" style={{ opacity: datesOk ? .6 : 1, fontWeight: datesOk ? 500 : 700 }}>
          {datesOk ? `${days} days` : "Till must come after From"}
        </p>
      )}

      <label className="block">
        <Label>Message <span style={{ color: "var(--w-faint)" }}>(optional)</span></Label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="tmui-in"
        />
      </label>

      {error && <p className="tmui-note" style={{ fontWeight: 700 }}>{error}</p>}

      <button type="submit" disabled={!valid || busy} className="tmui-cta mt-1 w-full">
        {busy ? "Sending" : "Send enquiry"}
      </button>
    </form>
  );
}
