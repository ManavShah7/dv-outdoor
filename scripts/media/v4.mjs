import { chromium, newCtx, say, SCR } from "./rec.mjs";
import { renameSync, readdirSync, existsSync, unlinkSync } from "fs";
const b = await chromium.launch();
const ctx = await newCtx(b, { w: 1238, h: 784, auth: true });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await p.waitForTimeout(3200);
await p.locator('button[aria-label="Close search"]').click();
await p.waitForTimeout(900);
await p.locator('aside button:has-text("Analytics")').click();
await p.waitForTimeout(2200);
await say(p, "Every booking since the beginning, kept.", 2500);

await p.mouse.move(700, 480);
await p.mouse.wheel(0, 380);
await p.waitForTimeout(1500);
await say(p, "Who buys, how often, how long they hold, what they pay.", 3000);

await p.locator('button:has-text("Jewellery")').first().click();
await p.waitForTimeout(1800);
await say(p, "Sliced by category, so you know who to call for a free site.", 3000);
await p.locator('button:has-text("Jewellery")').first().click();
await p.waitForTimeout(1200);

await p.locator("tbody tr:visible").first().click();
await p.waitForTimeout(2600);
await say(p, "Open a client and you get their whole history with DV.", 2800);
await p.mouse.move(900, 480);
await p.mouse.wheel(0, 420);
await p.waitForTimeout(1600);
await say(p, "When they book, where they buy, what sizes they take.", 3000);
await p.mouse.wheel(0, 420);
await p.waitForTimeout(1600);
await say(p, "This is the part the PowerPoint could never do.", 2800);
await p.waitForTimeout(800);

await p.close(); await ctx.close(); await b.close();
if (existsSync(`${SCR}/v4.webm`)) unlinkSync(`${SCR}/v4.webm`);
const f = readdirSync(SCR).filter(x => x.endsWith(".webm")).sort().pop();
renameSync(`${SCR}/${f}`, `${SCR}/v4.webm`);
console.log("v4 done");
