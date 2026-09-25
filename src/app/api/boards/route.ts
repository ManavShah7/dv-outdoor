import { requireAdmin, createAdminClient } from "@/lib/supabase/server";

/**
 * The office's writes. Everything the admin used to do to React state — which
 * survived until the next reload and never reached the public site — goes
 * through here instead.
 *
 * Admin-only. The service role bypasses RLS, so authorisation is checked here
 * first and every input is validated before it reaches Postgres.
 */

type Body = {
  code?: string;
  action?: "set_status" | "book" | "release" | "set_rate";
  status?: "available" | "damaged" | "under_maintenance";
  company?: string;
  rate?: number;
  startDate?: string;
  endDate?: string;
  printedBy?: "us" | "client";
  askingRate?: number;
};

const bad = (m: string, s = 400) => Response.json({ error: m }, { status: s });
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return bad("Not signed in as an admin.", 403);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const code = String(body?.code ?? "").trim();
  if (!code) return bad("Which board?");

  const db = createAdminClient();
  const { data: board, error: findErr } = await db
    .from("boards")
    .select("id,code,asking_rate")
    .eq("code", code)
    .maybeSingle();
  if (findErr) return bad(findErr.message, 500);
  if (!board) return bad(`No board with code ${code}.`, 404);

  switch (body?.action) {
    /* ------------------------------------------------- status by hand ----- */
    case "set_status": {
      const status = body.status;
      if (status !== "available" && status !== "damaged" && status !== "under_maintenance") {
        return bad("Status must be available, damaged or under_maintenance.");
      }
      // "booked" is not settable by hand — it is what having a live rental
      // means, and the trigger owns it. Booking goes through `book`.
      const { error } = await db.from("boards").update({ status }).eq("id", board.id);
      if (error) return bad(error.message, 500);
      return Response.json({ ok: true });
    }

    /* ------------------------------------------------------- book it ----- */
    case "book": {
      const company = String(body.company ?? "").trim();
      const rate = Number(body.rate);
      if (company.length < 2) return bad("Enter the client's name.");
      if (!Number.isFinite(rate) || rate < 0) return bad("Enter a valid rate.");
      if (!isDate(body.startDate) || !isDate(body.endDate)) return bad("Enter both dates as YYYY-MM-DD.");
      if (body.endDate! < body.startDate!) return bad("The end date is before the start date.");

      // One client, one row: the generated name_normalized column and its
      // unique index are what stop "Audi", "Audi " and "audi." becoming three.
      const { data: existing } = await db
        .from("companies")
        .select("id")
        .eq("name_normalized", company.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .maybeSingle();
      let companyId = existing?.id as string | undefined;
      if (!companyId) {
        const { data: made, error } = await db
          .from("companies")
          .insert({ name: company })
          .select("id")
          .single();
        if (error) return bad(error.message, 500);
        companyId = made.id;
      }

      const { error } = await db.from("rentals").insert({
        board_id: board.id,
        company_id: companyId,
        rate,
        rate_period: "per_month",
        start_date: body.startDate,
        end_date: body.endDate,
        status: "active",
        banner_printed_by: body.printedBy === "client" ? "client" : "us",
        asking_rate_at_booking: board.asking_rate,
        created_by: admin.id,
      });
      // The partial unique index is the real guard against double-booking.
      if (error) {
        return bad(
          error.code === "23505" ? "That board already has a live booking." : error.message,
          error.code === "23505" ? 409 : 500,
        );
      }
      return Response.json({ ok: true });
    }

    /* ---------------------------------------------------- give it back ---- */
    case "release": {
      const { error } = await db
        .from("rentals")
        .update({ status: "completed" })
        .eq("board_id", board.id)
        .eq("status", "active");
      if (error) return bad(error.message, 500);
      return Response.json({ ok: true });
    }

    /* ------------------------------------------------------ new price ---- */
    case "set_rate": {
      const askingRate = Number(body.askingRate);
      if (!Number.isFinite(askingRate) || askingRate < 0) return bad("Enter a valid rate.");
      const { error } = await db
        .from("boards")
        .update({ asking_rate: askingRate })
        .eq("id", board.id);
      if (error) return bad(error.message, 500);
      return Response.json({ ok: true });
    }

    default:
      return bad("Unknown action.");
  }
}
