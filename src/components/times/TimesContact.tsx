"use client";

import { useState } from "react";

/**
 * Not in the artwork — the frame was cropped part-way through the filter
 * rail and never reached a contact section. But ENQUIRE NOW and the CONTACT
 * link both have to land somewhere, so this is built in the same grid and
 * type as the rest and kept deliberately plain.
 *
 * Posts to the same /api/enquiry the board browser uses, so a lead from the
 * landing page lands in the office queue like any other.
 */
export function TimesContact() {
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
    <section id="contact" className="tm-contact tm-rb">
      <div className="tm-contact__copy">
        <h2 className="tm-display tm-t60">
          Tell us the<br /><span className="tm-red">city.</span>
        </h2>
        <p className="tm-t31" style={{ marginTop: "calc(40 * var(--u))" }}>
          We come back the same day with what is free, what it costs and a
          photo of every site.
        </p>
      </div>

      <div className="tm-contact__form">
        {sent ? (
          <p className="tm-display tm-t41">
            Got it. <span className="tm-red">We will call you today.</span>
          </p>
        ) : (
          <form onSubmit={submit} className="tm-contact__grid">
            <input className="tm-field" placeholder="Company name" value={companyName}
                   onChange={(e) => setCompany(e.target.value)} aria-label="Company name" />
            <input className="tm-field" placeholder="Your name" value={contactPerson}
                   onChange={(e) => setPerson(e.target.value)} aria-label="Your name" />
            <input className="tm-field" placeholder="Phone number" value={phone} inputMode="tel"
                   onChange={(e) => setPhone(e.target.value)} aria-label="Phone number" />
            <input className="tm-field" placeholder="Which cities, and roughly when?" value={message}
                   onChange={(e) => setMessage(e.target.value)} aria-label="Which cities, and roughly when" />
            <button type="submit" disabled={!valid || busy} className="tm-cta tm-contact__send">
              {busy ? "Sending" : "Send"}
            </button>
            {error && <p className="tm-t31 tm-red">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
