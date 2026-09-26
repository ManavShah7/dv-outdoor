/**
 * Seed the hotspot layer.
 *
 * Two sources, because neither is enough alone:
 *
 *   places.json     named POIs from OpenStreetMap — stations, markets, malls,
 *                   colleges, landmarks, beaches. OSM has these.
 *   junctions.json  road intersections computed from where trunk/primary/
 *                   secondary ways share a node. OSM tags zero traffic
 *                   signals in Saurashtra, so the junctions have to be
 *                   derived rather than read.
 *
 * Everything here is `source = 'osm'`. Re-running replaces those rows and
 * leaves `source = 'manual'` untouched — the hand-entered ones came from
 * someone who has actually stood at the junction, and no import should
 * overwrite that.
 *
 *   node scripts/seed-hotspots.mjs
 */
import { readFileSync, existsSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/**
 * How far each kind still pulls people, and how much it should count.
 * A railway station reaches most of a small town; a corner temple reaches
 * its own street. These are starting values meant to be argued with — the
 * admin can override any row.
 */
const PROFILE = {
  station:  { weight: 5, radius: 800 },
  market:   { weight: 4, radius: 500 },
  mall:     { weight: 4, radius: 600 },
  beach:    { weight: 4, radius: 800 },
  junction: { weight: 4, radius: 350 },
  college:  { weight: 3, radius: 400 },
  hospital: { weight: 3, radius: 400 },
  landmark: { weight: 3, radius: 500 },
  stadium:  { weight: 3, radius: 600 },
  cinema:   { weight: 3, radius: 300 },
  temple:   { weight: 2, radius: 300 },
};

const DIR = process.argv[2] ?? "/private/tmp/claude-501/-Users-manav/ac5ee47e-4d35-464a-b253-8cbac9653858/scratchpad/hs";
const read = (f) => (existsSync(`${DIR}/${f}`) ? JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")) : []);

const places = read("places.json");
// two passes: the first required two named roads, which returned nothing for
// the smaller towns where OSM has the roads but has never labelled them
const junctions = [...read("junctions.json"), ...read("junctions2.json")];
if (!places.length && !junctions.length) throw new Error(`no extract files in ${DIR}`);

/**
 * OSM's Indian tagging needs filtering before any of it goes on a map.
 *
 * 644 of the 1,070 places came back as `amenity=hospital`, and 624 of those
 * are single nodes — eye clinics, maternity homes, a doctor's own room. A
 * hospital that actually pulls a crowd is mapped as an area. Same for
 * temples: half are nodes, and among them a gaushala and three things called
 * "mandir". Keeping areas only cuts the noise without losing anything a
 * hoarding cares about.
 */
const AREA_ONLY = new Set(["hospital", "temple"]);
const JUNK = /^(mandir|temple|tample|hospital|gausala|gaushala|clinic)$/i;

function keep(p) {
  if (JUNK.test(p.name.trim())) return false;
  if (AREA_ONLY.has(p.kind) && p.osm.startsWith("n")) return false;
  return true;
}

const rows = [];

for (const p of places.filter(keep)) {
  const prof = PROFILE[p.kind] ?? { weight: 2, radius: 300 };
  rows.push({
    name: p.name, kind: p.kind, city: p.city,
    lat: p.lat, lng: p.lng,
    weight: prof.weight, radius_m: prof.radius,
    source: "osm", osm_ref: p.osm,
    // PostgREST rejects a bulk insert whose objects do not share keys, so
    // every row carries the same shape even when there is nothing to say
    notes: null,
  });
}

for (const j of junctions) {
  // `w` is the summed road rank of the top three arms — two trunks meeting
  // scores far higher than two tertiaries, and that maps cleanly onto 1-5.
  const weight = Math.max(2, Math.min(5, Math.round((j.w ?? 6) / 2.2)));
  rows.push({
    name: j.name, kind: "junction", city: j.city,
    lat: j.lat, lng: j.lng,
    weight, radius_m: PROFILE.junction.radius,
    source: "osm",
    osm_ref: `j:${j.city}:${j.lat},${j.lng}`,
    notes: "Junction derived from road classifications — OSM tags no traffic signals here.",
  });
}

// One OSM object can answer two of the tag queries — a fort that is also a
// temple, a place sitting inside two city boxes — and osm_ref is unique.
// First match wins, which is the higher-value kind because of the tag order.
const seen = new Set();
const deduped = rows.filter((r) => {
  if (!r.osm_ref) return true;
  if (seen.has(r.osm_ref)) return false;
  seen.add(r.osm_ref);
  return true;
});
console.log(`deduped ${rows.length - deduped.length} repeats`);
rows.length = 0;
rows.push(...deduped);

console.log(`prepared ${rows.length} rows — ${places.length} places filtered to ${rows.length - junctions.length}, plus ${junctions.length} junctions`);

// replace only what a previous import put there
const del = await fetch(`${URL_}/rest/v1/hotspots?source=eq.osm`, {
  method: "DELETE", headers: { ...H, Prefer: "return=minimal" },
});
console.log("cleared previous osm rows:", del.status);

for (let i = 0; i < rows.length; i += 400) {
  const slice = rows.slice(i, i + 400);
  const res = await fetch(`${URL_}/rest/v1/hotspots`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(slice),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  process.stdout.write(`\r  inserted ${Math.min(i + 400, rows.length)}/${rows.length}`);
}
process.stdout.write("\n");

const counts = await (
  await fetch(`${URL_}/rest/v1/hotspots?select=kind,city`, { headers: H })
).json();
const byKind = {};
for (const r of counts) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
console.log("in the database:", byKind);
console.log("total:", counts.length);
