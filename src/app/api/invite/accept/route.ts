import { createAdminClient } from "@/lib/supabase/server";

/**
 * Look up an invite by token. Public by necessity — the invitee is not signed
 * in yet — so it returns only what the accept screen needs to render, never
 * the invite list, never another invite, never anything about the admin.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  const db = createAdminClient();
  const { data } = await db
    .from("field_invites")
    .select("full_name, email, phone, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!data) return Response.json({ error: "This link is not valid." }, { status: 404 });
  if (data.status === "revoked") return Response.json({ error: "This invitation was cancelled." }, { status: 410 });
  if (data.status === "accepted") return Response.json({ error: "This invitation was already used." }, { status: 410 });
  if (new Date(data.expires_at) < new Date()) {
    return Response.json({ error: "This invitation has expired. Ask the office for a new link." }, { status: 410 });
  }

  return Response.json({
    invite: { fullName: data.full_name, email: data.email, phone: data.phone },
  });
}

/** Redeem the invite: create the auth user and mark the invite used. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = String(body?.token ?? "");
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const db = createAdminClient();

  // Re-validate server-side: never trust that the GET above still holds.
  const { data: invite } = await db
    .from("field_invites")
    .select("id, full_name, phone, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return Response.json({ error: "This link is not valid." }, { status: 404 });
  if (invite.status !== "pending") {
    return Response.json({ error: "This invitation is no longer usable." }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return Response.json({ error: "This invitation has expired." }, { status: 410 });
  }

  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // the admin already vetted them by sending the link
    user_metadata: { full_name: invite.full_name },
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Could not create the account.";
    const taken = /already|registered|exists/i.test(msg);
    return Response.json(
      { error: taken ? "An account with that email already exists. Try signing in." : msg },
      { status: taken ? 409 : 500 },
    );
  }

  // handle_new_user() has created the profile as field_agent/pending. The
  // invite itself is the approval, so lift it to approved and carry the name
  // the admin entered — the agent does not get to choose how they are labelled.
  await db
    .from("profiles")
    .update({ full_name: invite.full_name, phone: invite.phone, status: "approved" })
    .eq("id", created.user.id);

  await db
    .from("field_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: created.user.id })
    .eq("id", invite.id);

  return Response.json({ ok: true, email });
}
