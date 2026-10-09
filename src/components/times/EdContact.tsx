"use client";

import { useState } from "react";
import { SALES_EMAIL } from "@/lib/sales";
import { Reveal } from "@/components/times/Reveal";

/**
 * The enquiry band, in the editorial language.
 *
 * Posts to the same /api/enquiry the board browser uses, so a lead from the
 * landing page lands in the office queue beside one raised against a
 * specific board — same row, same statuses, same reply-by-email.
 *
 * Fields are underlined rather than boxed. Four hairline-ruled boxes in a
 * column was the loudest thing on the old page's last screen; a rule under
 * each field says the same thing and lets the serif heading carry the band.
 */
export function EdContact() {
  const [companyName, setCompany] = useState("");
  const [contactPerson, setPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      body: JSON.stringify({ companyName, contactPerson, phone, message }),
    });
    setBusy(false);
    if (res.ok) setSent(true);
    else setError((await res.json().catch(() => null))?.error ?? "Could not send that.");
  }

  return (
    <section id="contact" className="ed-contact ed-wrap">
      <div className="ed-contact__in">
        <div>
          <Reveal as="h2" className="ed-h2">Tell us the city.</Reveal>
          <Reveal delay={80}>
            <p className="ed-lead" style={{ marginTop: "1em", maxWidth: "30ch" }}>
              Tell us which cities and roughly when. We reply the same day with
              what is free and what it costs.
            </p>
            <p className="ed-body" style={{ marginTop: "1.6em" }}>
              Or write to{" "}
              <a href={`mailto:${SALES_EMAIL}`} className="ed-link"
                 style={{ letterSpacing: ".04em", textTransform: "none" }}>
                {SALES_EMAIL}
              </a>
            </p>
          </Reveal>
        </div>

        <Reveal delay={160}>
          {sent ? (
            <p className="ed-h3">
              Thank you — we will call you today.
            </p>
          ) : (
            <form onSubmit={submit} className="ed-form">
              <div className="ed-form__row">
                <input className="ed-in" placeholder="Company name" value={companyName}
                       onChange={(e) => setCompany(e.target.value)} aria-label="Company name" />
                <input className="ed-in" placeholder="Your name" value={contactPerson}
                       onChange={(e) => setPerson(e.target.value)} aria-label="Your name" />
              </div>
              <input className="ed-in" placeholder="Phone number" value={phone} inputMode="tel"
                     onChange={(e) => setPhone(e.target.value)} aria-label="Phone number" />
              <input className="ed-in" placeholder="Which cities, and roughly when?" value={message}
                     onChange={(e) => setMessage(e.target.value)} aria-label="Which cities, and roughly when" />
              <button type="submit" disabled={!valid || busy} className="ed-send">
                {busy ? "Sending" : "Send enquiry"}
              </button>
              {error && <p className="ed-body" style={{ color: "#c0392b" }}>{error}</p>}
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
