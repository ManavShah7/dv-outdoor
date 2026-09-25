import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { Board } from "@/lib/types";

/**
 * Boards, read from Postgres.
 *
 * Both portals used to import the same generated array at module load, which
 * meant the admin's edits lived in React state and the public site never saw
 * them — there was nothing to keep in sync, there was one array twice. This is
 * the single source both sides read.
 *
 * Runs under the service role because RLS is admin-only by design and the
 * public has no session. Only published boards leave this function, and
 * `toPublic()` in publicBoards.ts strips what a client should not see.
 */

type Row = {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  area: string | null;
  city: string;
  pincode: string | null;
  status: Board["status"] | "pending_installation" | "retired";
  lighting_type: Board["lighting"];
  size_category: Board["sizeCategory"] | null;
  width_ft: number | null;
  height_ft: number | null;
  asking_rate: number | null;
  updated_at: string;
  rentals: {
    rate: number;
    start_date: string;
    end_date: string | null;
    banner_printed_by: "us" | "client";
    companies: { name: string } | null;
  }[];
};

const SELECT =
  "id,code,name,lat,lng,address,area,city,pincode,status,lighting_type," +
  "size_category,width_ft,height_ft,asking_rate,updated_at," +
  "rentals!inner(rate,start_date,end_date,banner_printed_by,companies(name))";

function shape(r: Row): Board {
  // The partial unique index guarantees at most one active rental per board.
  const live = r.rentals?.[0];
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    address: r.address ?? "",
    area: r.area ?? "",
    city: r.city,
    pincode: r.pincode ?? "",
    // The public type has no vocabulary for pending_installation or retired,
    // and neither is something to sell, so they read as unavailable.
    status:
      r.status === "pending_installation" || r.status === "retired"
        ? "under_maintenance"
        : r.status,
    lighting: r.lighting_type,
    sizeCategory: r.size_category ?? "medium",
    widthFt: Number(r.width_ft ?? 0),
    heightFt: Number(r.height_ft ?? 0),
    askingRate: Number(r.asking_rate ?? 0),
    rental: live
      ? {
          company: live.companies?.name ?? "—",
          rate: Number(live.rate),
          startDate: live.start_date,
          endDate: live.end_date ?? live.start_date,
          printedBy: live.banner_printed_by,
          contactPerson: "—",
          phone: "—",
        }
      : undefined,
  };
}

/**
 * Every board, with the rental that is live on it today.
 *
 * PostgREST caps a response at 1000 rows, so this pages — 650 boards fits now
 * but the deck that is coming is bigger, and a silently truncated inventory is
 * the kind of bug nobody notices until a client asks where their board went.
 */
export async function getBoards({ publishedOnly = false } = {}): Promise<Board[]> {
  const db = createAdminClient();
  const out: Board[] = [];
  const PAGE = 1000;

  for (let from = 0; ; from += PAGE) {
    let q = db
      .from("boards")
      .select(SELECT.replace("rentals!inner", "rentals"))
      .order("code")
      .range(from, from + PAGE - 1);
    if (publishedOnly) q = q.eq("is_published", true);
    // only the live rental should come back with the board
    q = q.eq("rentals.status", "active");

    const { data, error } = await q;
    if (error) throw new Error(`getBoards: ${error.message}`);
    out.push(...(data as unknown as Row[]).map(shape));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function getBoardByCode(code: string): Promise<Board | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("boards")
    .select(SELECT.replace("rentals!inner", "rentals"))
    .eq("code", code)
    .eq("rentals.status", "active")
    .maybeSingle();
  if (error) throw new Error(`getBoardByCode: ${error.message}`);
  return data ? shape(data as unknown as Row) : null;
}

/** The public view of the live inventory: published boards only, with the
 *  client name and the agreed rent stripped. */
export async function getPublicBoards() {
  const { toPublic } = await import("@/lib/publicBoards");
  const boards = await getBoards({ publishedOnly: true });
  const publicBoards = boards.map(toPublic);
  const cities = [...new Set(publicBoards.map((b) => b.city))].sort();
  return { boards: publicBoards, cities };
}
