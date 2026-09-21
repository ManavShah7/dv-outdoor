#!/usr/bin/env node
/**
 * Parse a DV Outdoor availability deck into structured boards + photos.
 *
 *   node scripts/import-deck.mjs "private/deck/<file>.pptx"
 *
 * A .pptx is a zip of XML. Each board is one slide shaped like:
 *
 *     JUNAGADH – KALWA CHOWK CIRCLE – 25X20 BL
 *     Available
 *     Rs. 45000/-
 *
 * Writes private/deck/parsed.json and the slide photos to public/boards/.
 * Nothing is written to the database — this produces a file for review first,
 * because a bad parse that goes straight into inventory is very hard to unpick.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("usage: node scripts/import-deck.mjs <deck.pptx>");
  process.exit(1);
}

// ---- unzip via the system tool; no dependency needed for a read-only pass ---
const tmp = ".deck-tmp";
execFileSync("rm", ["-rf", tmp]);
mkdirSync(tmp, { recursive: true });
execFileSync("unzip", ["-qq", "-o", file, "-d", tmp]);

const read = (p) => readFileSync(path.join(tmp, p), "utf8");
const slideNums = execFileSync("ls", [path.join(tmp, "ppt/slides")])
  .toString().split("\n")
  .map((n) => /^slide(\d+)\.xml$/.exec(n.trim())?.[1])
  .filter(Boolean).map(Number).sort((a, b) => a - b);

/** Text runs, grouped per paragraph, in document order. */
function lines(xml) {
  return [...xml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)]
    .map((m) => [...m[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
      .map((t) => t[1]).join("")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const SIZE_RE = /(\d{1,3})\s*[xX*]\s*(\d{1,3})\s*(BL|FL)?\s*$/;
const RATE_RE = /Rs\.?\s*([\d,]+)/i;

function parseTitle(raw) {
  const t = raw.replace(/\s+/g, " ").trim();
  // en-dash, em-dash or hyphen separate city / location / size
  const city = t.split(/\s*[–—-]\s*/)[0]?.trim() ?? "";
  const m = SIZE_RE.exec(t);
  if (!m) return { city, location: null, widthFt: null, heightFt: null, lighting: null };
  const location = t
    .slice(city.length, t.lastIndexOf(m[0]))
    .replace(/^[\s–—,-]+|[\s–—,-]+$/g, "");
  return {
    city,
    location: location || null,
    widthFt: Number(m[1]),
    heightFt: Number(m[2]),
    lighting: m[3]?.toUpperCase() === "BL" ? "backlit"
            : m[3]?.toUpperCase() === "FL" ? "frontlit"
            : null,
  };
}

const outDir = "public/boards";
mkdirSync(outDir, { recursive: true });

const boards = [];
const skipped = [];
let seq = 0;

for (const n of slideNums) {
  const xml = read(`ppt/slides/slide${n}.xml`);
  const ls = lines(xml);
  if (ls.length === 0) { skipped.push({ slide: n, why: "no text" }); continue; }

  const parsed = parseTitle(ls[0]);
  if (!parsed.widthFt) { skipped.push({ slide: n, why: "no size in title", text: ls[0].slice(0, 70) }); continue; }

  const rateLine = ls.find((l) => RATE_RE.test(l));
  const rate = rateLine ? Number(RATE_RE.exec(rateLine)[1].replace(/,/g, "")) : null;
  const status = ls.some((l) => /available/i.test(l)) ? "available" : "unknown";

  // the slide's own image relationship
  const relPath = `ppt/slides/_rels/slide${n}.xml.rels`;
  let photo = null;
  try {
    const rel = read(relPath);
    const target = [...rel.matchAll(/Target="([^"]*media\/[^"]+)"/g)].map((m) => m[1])[0];
    if (target) {
      const src = path.join(tmp, "ppt", target.replace(/^\.\.\//, ""));
      seq += 1;
      const code = `JUN-${String(seq).padStart(3, "0")}`;
      const ext = path.extname(src).toLowerCase() === ".png" ? ".png" : ".jpg";
      const dest = path.join(outDir, code + ext);
      execFileSync("cp", [src, dest]);
      photo = `/boards/${code}${ext}`;
    }
  } catch { /* slide without a photo — recorded below as null */ }

  if (!photo) seq += 1;
  const code = `JUN-${String(seq).padStart(3, "0")}`;

  boards.push({
    code,
    slide: n,
    city: parsed.city ? parsed.city[0] + parsed.city.slice(1).toLowerCase() : null,
    location: parsed.location,
    widthFt: parsed.widthFt,
    heightFt: parsed.heightFt,
    sqft: parsed.widthFt * parsed.heightFt,
    lighting: parsed.lighting,      // null where the deck doesn't say
    askingRate: rate,
    status,
    photo,
    lat: null,                       // not in the deck — supplied separately
    lng: null,
    positionVerified: false,
  });
}

const out = {
  source: path.basename(file),
  importedAt: new Date().toISOString(),
  boards,
  skipped,
};
writeFileSync("private/deck/parsed.json", JSON.stringify(out, null, 2));
execFileSync("rm", ["-rf", tmp]);

console.log(`parsed ${boards.length} boards, skipped ${skipped.length}`);
console.log(`photos → ${outDir}/   data → private/deck/parsed.json`);
for (const s of skipped) console.log(`  skipped slide ${s.slide}: ${s.why}${s.text ? ` — "${s.text}"` : ""}`);
