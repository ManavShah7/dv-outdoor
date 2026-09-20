import { randomBytes } from "crypto";
import { createAdminClient, createClient, requireAdmin } from "@/lib/supabase/server";

/** List invites — admin only. */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_invites")
    .select("id, token, full_name, email, phone, status, expires_at, accepted_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ invites: data });
}

/** Create an invite for a field agent. The admin supplies the agent's name. */
export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const fullName = String(body?.fullName ?? "").trim();
  const email = String(body?.email ?? "").trim() || null;
  const phone = String(body?.phone ?? "").trim() || null;

  if (fullName.length < 2) {
    return Response.json({ error: "Enter the agent's name." }, { status: 400 });
  }
  if (!email && !phone) {
    return Response.json({ error: "Enter an email or a phone number." }, { status: 400 });
  }

  // 32 bytes of CSPRNG entropy — the token is the authorization, so it has to
  // be unguessable, not a sequential id or anything derived from the name.
  const token = randomBytes(32).toString("base64url");

  const db = createAdminClient();
  const { data, error } = await db
    .from("field_invites")
    .insert({ token, full_name: fullName, email, phone, invited_by: admin.id })
    .select("id, token, full_name, email, phone, status, expires_at, created_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ invite: data });
}

/** Revoke an invite. */
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("field_invites").update({ status: "revoked" }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
