import { chromium, newCtx, say, SCR } from "./rec.mjs";
import { renameSync, readdirSync, existsSync, unlinkSync } from "fs";
const b = await chromium.launch();
const ctx = await newCtx(b, { w: 1238, h: 784, auth: true });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
await p.locator('button[aria-label="Close search"]').click();   // full-bleed map to open on
await p.waitForTimeout(2400);

await say(p, "Every board DV owns, live on one map.", 2600);

await p.locator('aside button:has-text("Boards")').click();
await p.waitForTimeout(1800);
await say(p, "All 650 of them, in one list.", 2400);

await p.locator('aside button:has-text("Search")').click();
await p.waitForTimeout(1200);
await p.locator('button:has-text("Junagadh")').first().click();
await p.waitForTimeout(2800);
await say(p, "Filter by city, availability, size or lighting — the map follows.", 2900);

await p.locator('button:has-text("View Details")').first().click();
await p.waitForTimeout(6500);            // give Street View time to resolve
await say(p, "Rate, lease, size, lighting — and the exact spot.", 2600);
await say(p, "Street View, so you see the approach before you sell it.", 3000);
await p.waitForTimeout(900);

await p.close(); await ctx.close(); await b.close();
if (existsSync(`${SCR}/v1.webm`)) unlinkSync(`${SCR}/v1.webm`);
const f = readdirSync(SCR).filter(x => x.endsWith(".webm")).sort().pop();
renameSync(`${SCR}/${f}`, `${SCR}/v1.webm`);
console.log("v1 done");
