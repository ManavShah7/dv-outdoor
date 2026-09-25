import { chromium, newCtx, say, SCR } from "./rec.mjs";
import { renameSync, readdirSync, existsSync, unlinkSync } from "fs";
const b = await chromium.launch();
const ctx = await newCtx(b, { w: 1238, h: 784 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(2600);
await say(p, "The public site.", 2000, true);

/** Slow, even scroll — the reveals are scroll-linked, so they only look
 *  right if the page moves at a human speed. */
async function glide(px, steps = 26, pause = 46) {
  for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, px / steps); await p.waitForTimeout(pause); }
}

await p.mouse.move(619, 400);
await glide(1100);
await p.waitForTimeout(600);
await say(p, "What DV actually owns, in plain numbers.", 2600, true);
await glide(1300);
await p.waitForTimeout(500);
await say(p, "Boards free right now, with the rate on the card.", 2800, true);
await glide(1400);
await p.waitForTimeout(500);
await glide(1200);
await p.waitForTimeout(600);
await say(p, "Every city DV covers.", 2400, true);
await glide(1300);
await p.waitForTimeout(700);
await say(p, "And one form, so the enquiry reaches the office.", 2800, true);
await p.waitForTimeout(900);

await p.close(); await ctx.close(); await b.close();
if (existsSync(`${SCR}/v5.webm`)) unlinkSync(`${SCR}/v5.webm`);
const f = readdirSync(SCR).filter(x => x.endsWith(".webm")).sort().pop();
renameSync(`${SCR}/${f}`, `${SCR}/v5.webm`);
console.log("v5 done");
