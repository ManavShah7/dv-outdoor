"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const FIELD =
  "h-12 w-full min-w-0 rounded-[10px] border px-4 text-[15px] outline-none transition-shadow";

function fieldStyle() {
  return {
    borderColor: "var(--s-line)",
    background: "var(--s-bg)",
    color: "var(--s-text)",
  } as React.CSSProperties;
}

/** General "contact us" — no specific board attached. Posts to the same
 *  validated lead endpoint the per-board enquiry uses. */
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
      <div
        className="rounded-[18px] border p-10 text-center"
        style={{ borderColor: "var(--s-line)", background: "var(--s-bg)" }}
      >
        <span
          className="mx-auto grid size-14 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--s-good) 12%, transparent)" }}
        >
          <Check className="size-7" strokeWidth={2.6} style={{ color: "var(--s-good)" }} />
        </span>
        <h3 className="mt-5 text-[24px] font-[700] tracking-[-0.02em]" style={{ color: "var(--s-text)" }}>
          Thanks — we&rsquo;ve got it
        </h3>
        <p className="mx-auto mt-2.5 max-w-[34ch] text-[15px] leading-relaxed" style={{ color: "var(--s-text-soft)" }}>
          Someone from our office will call you today to talk through sites and dates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[18px] border p-7 sm:p-8"
      style={{ borderColor: "var(--s-line)", background: "var(--s-bg)", boxShadow: "0 1px 2px rgba(16,24,32,0.04), 0 12px 32px -12px rgba(16,24,32,0.10)" }}
    >
      <div className="flex flex-col gap-4">
        <input
          className={FIELD} style={fieldStyle()}
          value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className={FIELD} style={fieldStyle()}
            value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
            placeholder="Your name"
          />
          <input
            className={FIELD} style={fieldStyle()}
            value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
        <input
          className={FIELD} style={fieldStyle()} type="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
        />
        <textarea
          rows={4}
          className="w-full rounded-[10px] border p-4 text-[15px] outline-none"
          style={fieldStyle()}
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Which cities are you looking at? Any dates in mind?"
        />
      </div>

      {error && (
        <p className="mt-4 text-[14px]" style={{ color: "#c62828" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || busy}
        className="mt-5 h-13 w-full rounded-full py-3.5 text-[16px] font-[600] text-white transition-opacity disabled:opacity-40"
        style={{ background: "var(--s-accent)" }}
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>
      <p className="mt-3 text-center text-[13px]" style={{ color: "var(--s-text-soft)" }}>
        No commitment. We usually reply the same day.
      </p>
    </form>
  );
}
