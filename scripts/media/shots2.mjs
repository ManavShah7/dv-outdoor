import { chromium, FIELD_STATE } from "./rec.mjs";
const OUT = process.env.HOME + "/Desktop/times-media-assets";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });

// phone: the post-scan report, part-filled
const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true, storageState: FIELD_STATE,
  permissions: ["microphone", "camera"], reducedMotion: "reduce" });
await m.addInitScript(() => {
  const s = document.createElement("style");
  s.textContent = "nextjs-portal,[data-nextjs-toast],[data-nextjs-dev-tools-button]{display:none!important}";
  const add = () => document.head.appendChild(s);
  if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
});
const p = await m.newPage();
await p.goto("http://localhost:3000/field/JUN-003", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.getByRole("button", { name: /Urgent/ }).first().click();
await p.setInputFiles('input[type="file"]', ["public/boards/JUN-003.jpg"]);
await p.waitForTimeout(900);
await p.getByRole("button", { name: /Record a voice note/ }).click();
await p.waitForTimeout(8200);
await p.getByRole("button", { name: /Recording/ }).click();
await p.waitForTimeout(900);
await p.locator("textarea").fill("Left panel torn after last night's wind.");
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/field-report.png`, fullPage: true });
await m.close();

// client landing, full page
const d = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
  reducedMotion: "reduce" });
await d.addInitScript(() => {
  const s = document.createElement("style");
  s.textContent = "nextjs-portal,[data-nextjs-toast],[data-nextjs-dev-tools-button]{display:none!important}";
  const add = () => document.head.appendChild(s);
  if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
});
const q = await d.newPage();
await q.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await q.waitForTimeout(2500);
// scroll through once so the scroll-linked reveals have all fired
for (let y = 0; y < 9000; y += 700) { await q.evaluate((v) => scrollTo(0, v), y); await q.waitForTimeout(120); }
await q.evaluate(() => scrollTo(0, 0));
await q.waitForTimeout(1200);
await q.screenshot({ path: `${OUT}/client-landing.png`, fullPage: true });
await d.close();

await b.close();
console.log("shots2 done");
