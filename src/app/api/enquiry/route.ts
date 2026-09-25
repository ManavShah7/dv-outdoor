import { createAdminClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mail";

/**
 * Public enquiry ("check availability"). Writes a lead — never inventory.
 * Runs under the service role because the public has no Supabase session and
 * RLS is admin-only by design; everything it writes is validated here first.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const companyName = String(body?.companyName ?? "").trim();
  const contactPerson = String(body?.contactPerson ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const email = String(body?.email ?? "").trim() || null;
  const message = String(body?.message ?? "").trim() || null;
  const boardCode = String(body?.boardCode ?? "").trim() || null;
  const startDate = String(body?.startDate ?? "").trim() || null;
  const durationDays = Number(body?.durationDays) || null;

  if (companyName.length < 2) return Response.json({ error: "Enter your company name." }, { status: 400 });
  if (contactPerson.length < 2) return Response.json({ error: "Enter a contact name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 8) return Response.json({ error: "Enter a valid phone number." }, { status: 400 });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "That email does not look right." }, { status: 400 });
  }
  if (message && message.length > 2000) {
    return Response.json({ error: "Message is too long." }, { status: 400 });
  }

  // Boards live in Postgres now, so an enquiry points at the row rather than
  // mentioning the code in its message and hoping somebody reads it. Declared
  // out here because the notification below needs it too.
  let board: { id: string; code: string; name: string; address: string | null } | null = null;

  try {
    const db = createAdminClient();
    if (boardCode) {
      const { data } = await db
        .from("boards")
        .select("id,code,name,address")
        .eq("code", boardCode)
        .maybeSingle();
      board = data;
    }

    const { error } = await db.from("client_requests").insert({
      board_id: board?.id ?? null,
      company_name: companyName,
      contact_person: contactPerson,
      phone,
      email,
      // the board is a column now, so the message is just what they wrote
      message: message || null,
      requested_start_date: startDate,
      requested_duration_days: durationDays,
      source: "client_portal",
    });
    if (error) return Response.json({ error: "Could not send that. Please call us instead." }, { status: 500 });
  } catch {
    return Response.json({ error: "Could not send that. Please call us instead." }, { status: 500 });
  }

  // The lead is saved either way; the mail is a nudge, not the record. A
  // mailer that is down must never cost us the enquiry, so this is awaited
  // for its log but its result does not change the answer.
  await sendMail({
    subject: board
      ? `Enquiry — ${board.code}, ${board.name} — ${companyName}`
      : `Enquiry — ${companyName}`,
    replyTo: email ?? undefined,
    text: [
      `${contactPerson} at ${companyName}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      "",
      board ? `Board: ${board.code} — ${board.name}` : "No specific board",
      board ? `Address: ${board.address}` : null,
      startDate ? `Wants it from: ${startDate}` : null,
      durationDays ? `For: ${durationDays} days` : null,
      "",
      message ? `They said:\n${message}` : "No message.",
      "",
      "— sent by timesmedia.online",
    ]
      .filter((l) => l !== null)
      .join("\n"),
  });

  return Response.json({ ok: true });
}
