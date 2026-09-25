import { chromium, newCtx, say, SCR, FIELD_STATE } from "./rec.mjs";
import { renameSync, readdirSync, existsSync, unlinkSync } from "fs";

const b = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const ctx = await newCtx(b, {
  w: 390, h: 844, mobile: true, state: FIELD_STATE, perms: ["microphone", "camera"],
});
const p = await ctx.newPage();

// this is the URL the QR sticker on JUN-003 encodes
await p.goto("http://localhost:3000/field/JUN-003", { waitUntil: "networkidle" });
await p.waitForTimeout(1600);
await say(p, "Scan the QR on the board. It opens on that board, already signed in.", 3000);

await p.getByRole("button", { name: /Urgent/ }).first().click();
await p.waitForTimeout(1100);
await say(p, "How bad is it — today, this week, or whenever.", 2500);

await p.setInputFiles('input[type="file"]', ["public/boards/JUN-003.jpg"]);
await p.waitForTimeout(1600);
await say(p, "A photo of what is wrong.", 2200);

await p.getByRole("button", { name: /Record a voice note/ }).click();
await p.waitForTimeout(4200);
await p.getByRole("button", { name: /Recording/ }).click();
await p.waitForTimeout(1400);
await say(p, "Or just say it — most of the crew would rather talk, in Gujarati.", 3000);

await p.locator("textarea").click();
await p.locator("textarea").type("Left panel torn after last night's wind.", { delay: 55 });
await p.waitForTimeout(900);
await p.mouse.wheel(0, 700);
await p.waitForTimeout(1000);
await p.getByRole("button", { name: /Send to office/ }).click({ force: true });
await p.waitForTimeout(1600);
await say(p, "Sent. It is in the office queue before they walk back to the van.", 3000);
await p.waitForTimeout(700);

await p.close(); await ctx.close(); await b.close();
if (existsSync(`${SCR}/v2.webm`)) unlinkSync(`${SCR}/v2.webm`);
const f = readdirSync(SCR).filter(x => x.endsWith(".webm")).sort().pop();
renameSync(`${SCR}/${f}`, `${SCR}/v2.webm`);
console.log("v2 done");
