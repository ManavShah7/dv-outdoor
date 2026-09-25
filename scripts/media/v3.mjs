import { chromium, newCtx, say, SCR } from "./rec.mjs";
import { renameSync, readdirSync, existsSync, unlinkSync } from "fs";
const b = await chromium.launch();
const ctx = await newCtx(b, { w: 1238, h: 784, auth: true });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
await p.locator('button[aria-label="Close search"]').click();
await p.waitForTimeout(1800);
await say(p, "The crew's report lands in the office.", 2500);

await p.locator('aside button:has-text("Maintenance")').click();
await p.waitForTimeout(2600);
await say(p, "Every board needing work, worst first — triaged by urgency.", 2900);
await p.mouse.move(700, 480);
await p.mouse.wheel(0, 420);
await p.waitForTimeout(1400);
await say(p, "Boards still earning rent carry the money they are losing each day.", 3000);
await p.mouse.wheel(0, -420);
await p.waitForTimeout(1200);

await p.locator('button:has-text("View Details")').first().click();
await p.waitForTimeout(2400);
await say(p, "Open one and you get exactly what the crew sent.", 2500);
await p.mouse.move(430, 480);
await p.mouse.wheel(0, 380);
await p.waitForTimeout(1600);
await say(p, "Their note, the photo off the board, and the voice note in Gujarati.", 3200);
await p.mouse.wheel(0, 320);
await p.waitForTimeout(1800);
await say(p, "So the office knows what to load on the van before it leaves.", 3000);
await p.waitForTimeout(800);

await p.close(); await ctx.close(); await b.close();
if (existsSync(`${SCR}/v3.webm`)) unlinkSync(`${SCR}/v3.webm`);
const f = readdirSync(SCR).filter(x => x.endsWith(".webm")).sort().pop();
renameSync(`${SCR}/${f}`, `${SCR}/v3.webm`);
console.log("v3 done");
