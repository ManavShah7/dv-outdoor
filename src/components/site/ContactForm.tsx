"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const FIELD =
  "h-12 w-full min-w-0 rounded-[var(--radius-control)] bg-black/30 px-4 text-subhead text-ink-0 " +
  "placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none " +
  "transition-shadow focus:ring-2 focus:ring-accent";

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
      <div className="rounded-[var(--radius-panel)] bg-chrome-raised p-10 text-center ring-1 ring-white/[0.07] ring-inset">
        <span
          className="mx-auto grid size-14 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-available) 15%, transparent)" }}
        >
          <Check className="size-7" strokeWidth={2.6} style={{ color: "var(--color-available)" }} />
        </span>
        <h3 className="mt-5 text-title2 font-[680] text-ink-0">Thanks — we&rsquo;ve got it</h3>
        <p className="mx-auto mt-2.5 max-w-[34ch] text-subhead leading-relaxed text-ink-400">
          Someone from our office will call you today to talk through sites and dates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-panel)] bg-chrome-raised p-7 ring-1 ring-white/[0.07] ring-inset sm:p-8"
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
          placeholder="Which cities are you looking at? Any dates in mind?"
          className="w-full rounded-[var(--radius-control)] bg-black/30 p-4 text-subhead text-ink-0 placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {error && (
        <p className="mt-4 text-footnote" style={{ color: "var(--color-damaged)" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || busy}
        className="mt-5 h-12 w-full rounded-[var(--radius-pill)] bg-accent text-body font-[620] text-accent-on transition-opacity disabled:opacity-35"
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>
      <p className="mt-3 text-center text-caption text-ink-600">
        No commitment. We usually reply the same day.
      </p>
    </form>
  );
}
