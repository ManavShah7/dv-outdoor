/**
 * Screenshot the running app. Design is this project's failure mode, so the
 * rule is: look at the render before calling a screen done. Typecheck, lint
 * and build all pass on layouts that are visibly broken.
 *
 *   node scripts/screenshot.mjs [outDir] [url]
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "./.screenshots";
const url = process.argv[3] ?? "http://localhost:3000/";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
});

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(3500); // map tiles
await page.screenshot({ path: `${outDir}/home.png` });

console.log(`saved ${outDir}/home.png`);
console.log("console errors:", errors.length ? errors : "none");
await browser.close();
