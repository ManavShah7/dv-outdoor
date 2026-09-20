"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const FIELD = "w-field";

/** General enquiry — no board attached. Same validated endpoint as the
 *  per-board form. */
export function ContactForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
      body: JSON.stringify({ companyName, contactPerson, phone, email, message }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setError(d.error ?? "Could not send that."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-card p-10 text-center">
        <span
          className="mx-auto grid size-14 place-items-center rounded-full"
          style={{ background: "var(--w-free-tint)" }}
        >
          <Check className="size-7" strokeWidth={2.6} style={{ color: "var(--w-free)" }} />
        </span>
        <h3 className="mt-5 text-[22px] font-[700] tracking-[-0.02em]" style={{ color: "var(--w-text)" }}>Thanks — we&rsquo;ve got it</h3>
        <p className="mx-auto mt-2.5 max-w-[34ch] text-[15px] leading-relaxed" style={{ color: "var(--w-soft-text)" }}>
          Someone from our office will call you today to talk through sites and dates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-card p-7 sm:p-8"
    >
      <div className="flex flex-col gap-4">
        <input className={FIELD} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input className={FIELD} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Your name" />
          <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
        </div>
        <input className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Which cities, and roughly when?"
          className="w-field"
          style={{ height: "auto", padding: "12px 14px" }}
        />
      </div>

      {error && (
        <p className="mt-4 text-[14px]" style={{ color: "var(--w-warn)" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || busy}
        className="mt-5 h-12 w-full rounded-full text-[16px] font-[600] text-white transition-opacity disabled:opacity-40"
        style={{ background: "var(--w-accent)" }}
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>

    </form>
  );
}
