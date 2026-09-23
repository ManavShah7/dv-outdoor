"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const FIELD = "field";

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
      <div className="p-12 text-center">
        <span
          className="mx-auto grid size-14 place-items-center rounded-full"
          style={{ background: "#e8f5ee" }}
        >
          <Check className="size-7" strokeWidth={2.6} style={{ color: "#12784a" }} />
        </span>
        <h3 className="t-title mt-5">Thanks — we&rsquo;ve got it</h3>
        <p className="t-body mx-auto mt-3 max-w-[34ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
          Someone from our office will call you today to talk through sites and dates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="p-8"
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
          className="field"
          style={{ height: "auto", padding: "14px 16px" }}
        />
      </div>

      {error && (
        <p className="t-small mt-4" style={{ color: "#b4451c" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || busy}
        className="btn mt-6 w-full justify-center disabled:opacity-40"
      >
        {busy ? "Sending…" : "Send enquiry"}
      </button>

    </form>
  );
}
