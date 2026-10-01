/**
 * Score every board's visibility from the open data we actually hold, and
 * write the result back so both portals read the same numbers.
 *
 * Four independent sources, none of them guessed:
 *
 *   roads      OpenStreetMap (ODbL) — the nearest motorway/trunk/primary/
 *              secondary way, with its name, class and lane count. This is
 *              the single most relevant fact about a hoarding and it is a
 *              measurement, not a model.
 *   population Kontur (CC BY) — 400m H3 cells, summed inside 1 km. Kontur
 *              fuses GHSL, Meta's settlement layer and Microsoft building
 *              footprints.
 *   landmarks  OpenStreetMap (ODbL) — the 423 junctions, stations, markets,
 *              colleges and temples already in the hotspots table, counted
 *              only where the board falls inside the landmark's own reach.
 *   night      NASA VIIRS Black Marble, sampled from the Suomi-NPP annual
 *              composite tiles. Radiance at night is the best open proxy
 *              for commercial activity there is.
 *
 * The score is a weighted sum of the four, each normalised against the
 * spread across our own inventory rather than an absolute scale — "this
 * board versus the other 649" is the question a client is really asking.
 *
 *   node scripts/board-visibility.mjs            (reads, scores, writes)
 *   node scripts/board-visibility.mjs --dry      (prints, writes nothing)
 */
import { readFileSync, existsSync } from "node:fs";
import { cellToLatLng, getResolution } from "h3-js";
import { PNG } from "pngjs";

const DRY = process.argv.includes("--dry");
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/* ---------- geometry ---------- */
const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
function metres(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const m = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(m)));
}
/** distance from a point to a segment, in metres, flat-earth at this scale */
function toSegment(plat, plng, alat, alng, blat, blng) {
  const kx = Math.cos(rad(plat)) * 111320, ky = 110540;
  const px = plng * kx, py = plat * ky;
  const ax = alng * kx, ay = alat * ky;
  const bx = blng * kx, by = blat * ky;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* ---------- 1. boards ---------- */
async function get(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
// PostgREST caps a response at 1000 rows, and 650 boards is close enough to
// that cap to be worth paging anyway.
const boards = [];
for (let from = 0; ; from += 500) {
  const page = await fetch(`${URL_}/rest/v1/boards?select=id,code,name,lat,lng,city&order=code`, {
    headers: { ...H, Range: `${from}-${from + 499}` },
  }).then((r) => r.json());
  boards.push(...page);
  if (page.length < 500) break;
}
console.log(`boards: ${boards.length}`);

/* ---------- 2. roads, with the tags the simplified layer drops ---------- */
const RAW = process.env.ROADS_JSON ??
  "/private/tmp/claude-501/-Users-manav/ac5ee47e-4d35-464a-b253-8cbac9653858/scratchpad/roads.json";
if (!existsSync(RAW)) throw new Error(`no Overpass extract at ${RAW} — set ROADS_JSON`);
const CLASS_RANK = { motorway: 4, trunk: 4, primary: 3, secondary: 2 };
const roads = JSON.parse(readFileSync(RAW, "utf8")).elements
  .filter((e) => (e.geometry || []).length > 1)
  .map((e) => ({
    name: e.tags.name ?? e.tags["name:en"] ?? null,
    cls: e.tags.highway,
    lanes: Number(e.tags.lanes) || null,
    speed: Number(String(e.tags.maxspeed ?? "").replace(/\D/g, "")) || null,
    g: e.geometry.map((p) => [p.lat, p.lon]),
  }));
console.log(`roads: ${roads.length} ways`);

// a coarse grid so 650 boards do not each walk 10k ways
const CELL = 0.05;
const grid = new Map();
const key = (la, lo) => `${Math.floor(la / CELL)}:${Math.floor(lo / CELL)}`;
roads.forEach((w, i) => {
  const seen = new Set();
  for (const [la, lo] of w.g) {
    const k = key(la, lo);
    if (seen.has(k)) continue;
    seen.add(k);
    (grid.get(k) ?? grid.set(k, []).get(k)).push(i);
  }
});

function nearestRoad(lat, lng) {
  const cand = new Set();
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      for (const i of grid.get(key(lat + dy * CELL, lng + dx * CELL)) ?? []) cand.add(i);
  let best = null;
  for (const i of cand) {
    const w = roads[i];
    for (let k = 0; k < w.g.length - 1; k++) {
      const d = toSegment(lat, lng, w.g[k][0], w.g[k][1], w.g[k + 1][0], w.g[k + 1][1]);
      if (!best || d < best.m) best = { m: d, w };
    }
  }
  return best;
}

/* ---------- 3. population, 400m cells into a grid ---------- */
const pop = await fetch(`${URL_}/storage/v1/object/public/dv-assets/data/pop-saurashtra.json`)
  .then((r) => r.json());
console.log(`population: ${pop.cells.length} cells at h3 res ${getResolution(pop.cells[0][0])}`);
const pgrid = new Map();
for (const [h3, v] of pop.cells) {
  const [la, lo] = cellToLatLng(h3);
  const k = key(la, lo);
  (pgrid.get(k) ?? pgrid.set(k, []).get(k)).push([la, lo, v]);
}
function peopleWithin(lat, lng, radius) {
  let sum = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      for (const [la, lo, v] of pgrid.get(key(lat + dy * CELL, lng + dx * CELL)) ?? [])
        if (metres(lat, lng, la, lo) <= radius) sum += v;
  return Math.round(sum);
}

/* ---------- 4. landmarks already in the database ---------- */
const hotspots = await get("hotspots?select=name,kind,lat,lng,weight,radius_m");
console.log(`landmarks: ${hotspots.length}`);
function pullAt(lat, lng) {
  const near = hotspots
    .map((h) => ({ h, m: metres(lat, lng, h.lat, h.lng) }))
    .filter((x) => x.m <= x.h.radius_m)
    .sort((a, b) => b.h.weight - a.h.weight || a.m - b.m);
  return { list: near, score: near.reduce((s, x) => s + x.h.weight, 0) };
}

/* ---------- 5. night-time radiance, sampled from NASA's own tiles ---------- */
/* Black Marble tops out at zoom 8 because the sensor is 463m — which is the
   right resolution for "is this a lit commercial district", and the wrong one
   for anything finer. One tile covers all of Saurashtra at z7, so this is a
   single fetch and a pixel lookup, not a raster pipeline. */
const Z = 8, TILE = 256;
const lonToX = (lo, z) => ((lo + 180) / 360) * 2 ** z;
const latToY = (la, z) =>
  ((1 - Math.log(Math.tan(rad(la)) + 1 / Math.cos(rad(la))) / Math.PI) / 2) * 2 ** z;

const tiles = new Map();
async function radiance(lat, lng) {
  const fx = lonToX(lng, Z), fy = latToY(lat, Z);
  const tx = Math.floor(fx), ty = Math.floor(fy);
  const k = `${tx}/${ty}`;
  if (!tiles.has(k)) {
    const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/${Z}/${ty}/${tx}.png`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    tiles.set(k, PNG.sync.read(buf));
  }
  const png = tiles.get(k);
  const px = Math.min(TILE - 1, Math.floor((fx - tx) * TILE));
  const py = Math.min(TILE - 1, Math.floor((fy - ty) * TILE));
  const i = (py * png.width + px) * 4;
  // Black Marble is a colour composite; luminance is the honest read of it
  return 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
}

/* ---------- score ---------- */
const rows = [];
for (const b of boards) {
  const road = nearestRoad(b.lat, b.lng);
  const people = peopleWithin(b.lat, b.lng, 1000);
  const pull = pullAt(b.lat, b.lng);
  const night = await radiance(b.lat, b.lng);
  rows.push({ b, road, people, pull, night });
  if (rows.length % 100 === 0) process.stdout.write(`\r  scored ${rows.length}/${boards.length}`);
}
process.stdout.write(`\r  scored ${rows.length}/${boards.length}\n`);

/** Rank within our own inventory: the useful question is not "how bright in
 *  absolute terms" but "how does this board compare with the others". */
function percentiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < v) lo = mid + 1; else hi = mid; }
    return lo / Math.max(1, sorted.length - 1);
  };
}
const pPeople = percentiles(rows.map((r) => r.people));
const pPull   = percentiles(rows.map((r) => r.pull.score));
const pNight  = percentiles(rows.map((r) => r.night));

const W = { road: 0.34, people: 0.26, pull: 0.22, night: 0.18 };
const out = rows.map(({ b, road, people, pull, night }) => {
  const roadRank = road && road.m <= 120 ? (CLASS_RANK[road.w.cls] ?? 1) : 0; // 0-4
  const parts = {
    road:   roadRank / 4,
    people: pPeople(people),
    pull:   pPull(pull.score),
    night:  pNight(night),
  };
  const score = Math.round(100 *
    (W.road * parts.road + W.people * parts.people + W.pull * parts.pull + W.night * parts.night));
  return {
    board_id: b.id,
    score,
    road_name: road?.w?.name ?? null,
    road_class: road ? road.w.cls : null,
    road_distance_m: road ? Math.round(road.m) : null,
    road_lanes: road?.w?.lanes ?? null,
    people_1km: people,
    landmark_count: pull.list.length,
    landmark_top: pull.list.slice(0, 3).map((x) => ({ name: x.h.name, kind: x.h.kind, m: Math.round(x.m) })),
    night_percentile: Math.round(pNight(night) * 100),
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v * 100)])),
  };
});

/* ---------- report ---------- */
const sorted = [...out].sort((a, b) => b.score - a.score);
const byId = new Map(boards.map((b) => [b.id, b]));
const show = (r) => {
  const b = byId.get(r.board_id);
  console.log(`  ${String(r.score).padStart(3)}  ${b.code}  ${(b.name ?? "").slice(0, 26).padEnd(26)} ` +
    `${(r.road_name ?? "—").slice(0, 22).padEnd(22)} ${String(r.road_class ?? "—").padEnd(10)} ` +
    `${String(r.road_distance_m ?? "—").padStart(5)}m  ${String(r.people_1km).padStart(6)} ppl  ` +
    `${String(r.landmark_count).padStart(2)} lm  night p${r.night_percentile}`);
};
console.log("\ntop 10:");   sorted.slice(0, 10).forEach(show);
console.log("\nbottom 5:"); sorted.slice(-5).forEach(show);
const avg = (f) => Math.round(out.reduce((s, r) => s + f(r), 0) / out.length);
console.log(`\nmeans — score ${avg((r) => r.score)}, people/km ${avg((r) => r.people_1km)}, ` +
  `landmarks ${avg((r) => r.landmark_count)}, on a named road: ` +
  `${out.filter((r) => r.road_name && r.road_distance_m <= 120).length}/${out.length}`);
const cls = {};
for (const r of out) { const k = r.road_distance_m <= 120 ? r.road_class : "none within 120m"; cls[k] = (cls[k] ?? 0) + 1; }
console.log("nearest major road class:", cls);

if (DRY) { console.log("\n--dry: nothing written"); process.exit(0); }

/* ---------- write ---------- */
for (let i = 0; i < out.length; i += 200) {
  const slice = out.slice(i, i + 200);
  const res = await fetch(`${URL_}/rest/v1/board_visibility?on_conflict=board_id`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(slice),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  process.stdout.write(`\r  wrote ${Math.min(i + 200, out.length)}/${out.length}`);
}
console.log("\ndone");
