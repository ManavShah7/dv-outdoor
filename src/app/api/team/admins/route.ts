import { createAdminClient, requireAdmin } from "@/lib/supabase/server";

/** Create another admin. Admin-gated; the service role never reaches a browser. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const fullName = String(body?.fullName ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (fullName.length < 2) {
    return Response.json({ error: "Enter a name." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    const msg = error?.message ?? "Could not create the account.";
    const taken = /already|registered|exists/i.test(msg);
    return Response.json({ error: taken ? "That email already has an account." : msg }, { status: taken ? 409 : 500 });
  }

  await db.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
  const { error: promoteErr } = await db.rpc("promote_to_admin", { target: data.user.id });
  if (promoteErr) {
    // fall back to a direct update — the RPC is admin-gated via is_admin(),
    // which the service role does not satisfy
    await db.from("profiles").update({ role: "admin", status: "approved" }).eq("id", data.user.id);
  }

  return Response.json({ ok: true, email });
}

/** Team roster. */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, email, full_name, phone, role, status, created_at")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ people: data });
}
