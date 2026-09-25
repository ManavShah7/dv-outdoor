/**
 * Push the board photos, the imported deck and the audio into Supabase
 * Storage, which is where the deployed site reads them from.
 *
 * These files are gitignored on purpose — the repo is public and this is the
 * family's business data. Run this after importing a new city's deck:
 *
 *   node scripts/upload-assets.mjs
 *
 * It is idempotent (upsert), so re-running is safe.
 */
import { readFileSync, readdirSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
const BUCKET = "dv-assets";

// bucket
let r = await fetch(`${URL_}/storage/v1/bucket`, {
  method: "POST", headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 20971520 }),
});
console.log("bucket:", r.status, (await r.text()).slice(0, 200));

async function put(path, body, type) {
  const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST", headers: { ...H, "Content-Type": type, "x-upsert": "true" }, body,
  });
  if (!res.ok) console.log("FAIL", path, res.status, (await res.text()).slice(0, 160));
  return res.ok;
}

let n = 0;
for (const f of readdirSync("public/boards").filter((f) => f.endsWith(".jpg"))) {
  if (await put(`boards/${f}`, readFileSync(`public/boards/${f}`), "image/jpeg")) n++;
}
console.log("photos:", n);

console.log("audio:", await put("audio/voice-sample.mp3", readFileSync("public/audio/voice-sample.mp3"), "audio/mpeg"));

// the deck JSON, with photo paths rewritten to storage keys
const deck = JSON.parse(readFileSync("private/deck/parsed.json", "utf8"));
for (const b of deck.boards) if (b.photo) b.photo = b.photo.replace(/^\/boards\//, "boards/");
console.log("deck:", await put("deck/parsed.json", JSON.stringify(deck), "application/json"));
console.log("public base:", `${URL_}/storage/v1/object/public/${BUCKET}/`);
