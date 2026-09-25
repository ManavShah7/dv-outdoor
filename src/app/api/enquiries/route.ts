import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { sendMail, SALES_EMAIL } from "@/lib/mail";

/**
 * What the office does with a lead: move it along, or write back.
 *
 * Replying from here rather than from a personal inbox means the reply is
 * attached to the enquiry, the status moves on its own, and whoever picks the
 * thread up next can see it was answered.
 */

type Body = {
  id?: string;
  action?: "set_status" | "reply";
  status?: string;
  declineReason?: string;
  subject?: string;
  message?: string;
};

const STATUSES = ["new", "contacted", "negotiating", "converted", "declined", "lost"] as const;
const bad = (m: string, s = 400) => Response.json({ error: m }, { status: s });

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return bad("Not signed in as an admin.", 403);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const id = String(body?.id ?? "").trim();
  if (!id) return bad("Which enquiry?");

  const db = createAdminClient();
  const { data: row, error: findErr } = await db
    .from("client_requests")
    .select("id,company_name,contact_person,email,status,boards(code,name)")
    .eq("id", id)
    .maybeSingle();
  if (findErr) return bad(findErr.message, 500);
  if (!row) return bad("That enquiry no longer exists.", 404);

  if (body?.action === "set_status") {
    const status = String(body.status ?? "");
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) return bad("Unknown status.");

    const patch: Record<string, unknown> = { status, handled_by: admin.id };
    // Stamp the moments worth knowing later: when someone first picked it up,
    // and when it stopped being live.
    if (status !== "new" && !row.status.match(/^(contacted|negotiating|converted|declined|lost)$/)) {
      patch.contacted_at = new Date().toISOString();
    }
    if (status === "converted" || status === "declined" || status === "lost") {
      patch.closed_at = new Date().toISOString();
      if (status === "declined") patch.decline_reason = String(body.declineReason ?? "").trim() || null;
    } else {
      patch.closed_at = null;
    }

    const { error } = await db.from("client_requests").update(patch).eq("id", id);
    if (error) return bad(error.message, 500);
    return Response.json({ ok: true });
  }

  if (body?.action === "reply") {
    const message = String(body.message ?? "").trim();
    if (message.length < 2) return bad("Write something first.");
    if (!row.email) return bad("No email on this enquiry — call them instead.", 422);

    const board = Array.isArray(row.boards) ? row.boards[0] : row.boards;
    const subject =
      String(body.subject ?? "").trim() ||
      (board ? `Re: ${board.code} — ${board.name}` : "Re: your enquiry");

    const sent = await sendMail({
      to: row.email,
      subject,
      replyTo: SALES_EMAIL,
      text: `${message}\n\n—\nThe Times Media · ${SALES_EMAIL}`,
    });
    if (!sent.sent) {
      return bad(
        sent.reason === "not configured"
          ? "Email is not set up yet — no key configured."
          : "Could not send that email.",
        502,
      );
    }

    // A reply is contact. Move it along unless it is already further on.
    const patch: Record<string, unknown> = { handled_by: admin.id };
    if (row.status === "new") {
      patch.status = "contacted";
      patch.contacted_at = new Date().toISOString();
    }
    await db.from("client_requests").update(patch).eq("id", id);
    return Response.json({ ok: true });
  }

  return bad("Unknown action.");
}
