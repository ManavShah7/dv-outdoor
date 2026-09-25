import { chromium, STATE } from "./rec.mjs";
const OUT = process.env.HOME + "/Desktop/times-media-assets";
const W = 1238, H = 784;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2,
                                 reducedMotion: "reduce", storageState: STATE });
await ctx.addInitScript(() => {
  const s = document.createElement("style");
  s.textContent = "nextjs-portal,[data-nextjs-toast],[data-nextjs-dev-tools-button]{display:none!important}";
  const add = () => document.head.appendChild(s);
  if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
});
const p = await ctx.newPage();

await p.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await p.waitForTimeout(5000);
await p.locator('button[aria-label="Close search"]').click();
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/admin-map.png` });

await p.locator('aside button:has-text("Boards")').click();
await p.waitForTimeout(2000);
await p.locator('button[aria-label*="rid"], button[aria-label*="Grid"]').first().click().catch(() => {});
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/admin-boards.png` });

await p.locator('aside button:has-text("Maintenance")').click();
await p.waitForTimeout(3000);
await p.screenshot({ path: `${OUT}/maintenance-queue.png` });

await p.locator('button:has-text("View Details")').first().click();
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/maintenance-detail.png` });

await p.locator('aside button:has-text("Analytics")').click();
await p.waitForTimeout(3000);
await p.screenshot({ path: `${OUT}/admin-analytics.png` });

await p.goto("http://localhost:3000/boards", { waitUntil: "networkidle" });
await p.waitForTimeout(5500);
await p.screenshot({ path: `${OUT}/client-map.png` });

await p.goto("http://localhost:3000/boards?board=JUN-002", { waitUntil: "networkidle" });
await p.waitForTimeout(6500);
await p.screenshot({ path: `${OUT}/client-board.png` });

await b.close();
console.log("shots done");
