/**
 * Put the inventory in the database.
 *
 * Until now both portals imported the same generated array at module load, so
 * the admin's edits lived in React state and the public site never saw them.
 * There was no connection to keep in sync — there was one array, twice.
 *
 * This inserts companies, boards and the full rental ledger so Postgres is the
 * single source of truth. It is idempotent: re-running upserts by the natural
 * keys (company name, board code) rather than duplicating.
 *
 *   npx tsx scripts/seed-db.mjs          # insert / update
 *   npx tsx scripts/seed-db.mjs --wipe   # clear first
 *
 * Run through tsx because the lib files import each other without extensions,
 * which plain Node ESM will not resolve.
 *
 * The generated rows stay generated — this does not make the data true, it
 * makes it shared. Real inventory replaces it by the same route.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) throw new Error("Supabase env missing from .env.local");

const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, init = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...init.headers } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/** POST in batches — a single 650-row insert is fine, 3000 rentals is not. */
async function insert(table, rows, { onConflict, chunk = 500 } = {}) {
  let done = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const q = onConflict ? `${table}?on_conflict=${onConflict}` : table;
    await rest(q, {
      method: "POST",
      headers: { Prefer: onConflict ? "resolution=merge-duplicates,return=minimal" : "return=minimal" },
      body: JSON.stringify(slice),
    });
    done += slice.length;
    process.stdout.write(`\r  ${table}: ${done}/${rows.length}`);
  }
  process.stdout.write("\n");
}

const { BOARDS } = await import("../src/lib/mockBoards.ts");
const { RENTALS } = await import("../src/lib/mockRentals.ts");
const { COMPANIES } = await import("../src/lib/companies.ts");

if (process.argv.includes("--wipe")) {
  console.log("wiping rentals, boards, companies…");
  // order matters: rentals reference both
  for (const t of ["rental_events", "rentals", "board_status_history", "board_price_history", "boards", "companies"]) {
    await rest(`${t}?id=not.is.null`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  }
}

// ------------------------------------------------------------------ companies
console.log("companies…");
await insert(
  "companies",
  COMPANIES.map((c) => ({ name: c.name, industry: c.category })),
  { onConflict: "name_normalized" },
);
const companyRows = await rest("companies?select=id,name");
const companyId = new Map(companyRows.map((c) => [c.name, c.id]));

// --------------------------------------------------------------------- boards
console.log("boards…");
await insert(
  "boards",
  BOARDS.map((b) => ({
    code: b.code,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
    address: b.address,
    area: b.area,
    city: b.city,
    pincode: b.pincode,
    lighting_type: b.lighting,
    size_category: b.sizeCategory,
    width_ft: b.widthFt,
    height_ft: b.heightFt,
    asking_rate: b.askingRate,
    // rentals drive booked/available; only the states a rental cannot express
    // are set here, and the trigger leaves those alone.
    status: b.status === "booked" ? "available" : b.status,
    is_published: true,
  })),
  { onConflict: "code" },
);
const boardRows = await rest("boards?select=id,code");
const boardId = new Map(boardRows.map((b) => [b.code, b.id]));

// -------------------------------------------------------------------- rentals
console.log("rentals…");
const rentals = RENTALS.filter((r) => boardId.has(r.boardCode) && companyId.has(r.company)).map((r) => ({
  board_id: boardId.get(r.boardCode),
  company_id: companyId.get(r.company),
  rate: r.rate,
  rate_period: "per_month",
  start_date: r.startDate,
  end_date: r.endDate,
  status: r.status,
  banner_printed_by: r.printedBy,
  asking_rate_at_booking: r.askingRateAtBooking,
  board_city_at_booking: r.city,
  board_area_at_booking: r.area,
  board_size_at_booking: r.sizeCategory,
  board_light_at_booking: r.lighting,
}));
// Active first: the partial unique index allows one active rental per board,
// and a failure part-way through should not leave a board with none.
rentals.sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1));
await insert("rentals", rentals);

const counts = {};
for (const t of ["companies", "boards", "rentals"]) {
  const res = await fetch(`${URL_}/rest/v1/${t}?select=id&limit=1`, {
    headers: { ...H, Prefer: "count=exact" },
  });
  counts[t] = (res.headers.get("content-range") ?? "").split("/")[1];
}
console.log("\nin the database now:", counts);
