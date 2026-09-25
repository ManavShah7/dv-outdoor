import "server-only";

/**
 * Outbound mail.
 *
 * Until now an enquiry was written to `client_requests` and read by nothing —
 * a lead could sit in a table for a week with nobody aware of it. This is the
 * nudge.
 *
 * Resend over its REST API rather than the SDK: one POST, no dependency. If
 * no key is configured the enquiry still saves and this says so in the log
 * rather than throwing — losing the lead because the mailer is not set up yet
 * would be worse than not sending the mail.
 */

export { SALES_EMAIL } from "@/lib/sales";
import { SALES_EMAIL } from "@/lib/sales";

/** Whichever address Resend has verified for the domain. */
const FROM = process.env.MAIL_FROM ?? `The Times Media <${SALES_EMAIL}>`;

export type Mail = {
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendMail({ to, subject, text, replyTo }: Mail): Promise<
  { sent: true } | { sent: false; reason: string }
> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[mail] RESEND_API_KEY not set — "${subject}" not sent`);
    return { sent: false, reason: "not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [to ?? SALES_EMAIL],
        subject,
        text,
        // so hitting reply in the inbox goes to the client, not to ourselves
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[mail] ${res.status} ${body.slice(0, 200)}`);
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[mail]", e);
    return { sent: false, reason: "network" };
  }
}
