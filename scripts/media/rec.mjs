import { chromium } from "playwright";
import { existsSync } from "fs";

export const SCR = "/private/tmp/claude-501/-Users-manav/ac5ee47e-4d35-464a-b253-8cbac9653858/scratchpad/vid";
export const STATE = `${SCR}/admin-state.json`;
export const FIELD_STATE = `${SCR}/field-state.json`;

/** Caption overlay — SF Pro Display, one line, centred over a soft bottom scrim.
 *  The scrim is what keeps it legible over a moving map without a hard plate,
 *  and centring keeps it clear of the sidebar footer and Google's attribution. */
export const CAPTION_CSS = `
nextjs-portal,[data-nextjs-toast]{display:none!important}
#cap-scrim{
  position:fixed; left:0; right:0; bottom:0; height:260px; z-index:2147483646;
  background:linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.52) 30%,rgba(0,0,0,0) 100%);
  opacity:0; transition:opacity .45s cubic-bezier(.26,.67,.48,.91); pointer-events:none;
}
#cap{
  position:fixed; left:0; right:0; bottom:78px; z-index:2147483647;
  text-align:center; padding:0 80px;
  font:500 19px/1.32 -apple-system,"SF Pro Display","SF Pro Text",system-ui,sans-serif;
  letter-spacing:.008em; color:#fff;
  text-shadow:0 1px 16px rgba(0,0,0,.5);
  opacity:0; transform:translateY(8px);
  transition:opacity .45s cubic-bezier(.26,.67,.48,.91), transform .45s cubic-bezier(.26,.67,.48,.91);
  pointer-events:none;
}
#cap-scrim.on{opacity:1}
#cap.on{opacity:1; transform:translateY(0)}
html.cap-sm #cap{font-size:13px; bottom:34px; padding:0 22px; letter-spacing:.004em}
html.cap-sm #cap-scrim{height:150px}
/* over light pages a scrim just greys the photography out, so the caption
   gets its own small plate instead and the page is left alone */
#cap .b{display:inline-block}
#cap.dark{color:#1d1d1f; text-shadow:none}
#cap.dark .b{
  background:rgba(255,255,255,.94); border-radius:980px; padding:13px 26px;
  box-shadow:0 10px 34px rgba(0,0,0,.14), 0 1px 3px rgba(0,0,0,.10);
}
#cap-scrim.light{background:none}
html.cap-sm #cap.dark .b{padding:9px 18px}
`;

export async function newCtx(b, { w, h, mobile = false, perms = [], auth = false, state = null }) {
  const ctx = await b.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: mobile ? 3 : 1,
    isMobile: mobile, hasTouch: mobile,
    permissions: perms,
    ...(state && existsSync(state) ? { storageState: state } : auth && existsSync(STATE) ? { storageState: STATE } : {}),
    recordVideo: { dir: SCR, size: { width: w, height: h } },
  });
  await ctx.addInitScript(({ css, small }) => {
    if (small) document.documentElement.classList.add("cap-sm");
    const add = () => {
      const s = document.createElement("style"); s.id = "cap-css"; s.textContent = css;
      document.head.appendChild(s);
    };
    if (document.head) add();
    else document.addEventListener("DOMContentLoaded", add);
    if (small) {
      const mark = () => document.documentElement.classList.add("cap-sm");
      if (document.documentElement) mark();
      document.addEventListener("DOMContentLoaded", mark);
    }
  }, { css: CAPTION_CSS, small: w < 700 });
  return ctx;
}

/** show a caption for `hold` ms, then fade it out */
export async function say(p, text, hold = 2600, dark = false) {
  await p.evaluate(([t, d, css]) => {
    if (!document.getElementById("cap-css")) {
      const s = document.createElement("style"); s.id = "cap-css"; s.textContent = css;
      document.head.appendChild(s);
    }
    let sc = document.getElementById("cap-scrim");
    if (!sc) { sc = document.createElement("div"); sc.id = "cap-scrim"; document.body.appendChild(sc); }
    let c = document.getElementById("cap");
    if (!c) { c = document.createElement("div"); c.id = "cap"; document.body.appendChild(c); }
    c.innerHTML = ""; const box = document.createElement("span");
    box.className = "b"; box.textContent = t; c.appendChild(box);
    c.classList.toggle("dark", d); sc.classList.toggle("light", d);
    // force a frame so the transition actually runs
    void c.offsetWidth;
    sc.classList.add("on"); c.classList.add("on");
  }, [text, dark, CAPTION_CSS]);
  await p.waitForTimeout(hold);
  await p.evaluate(() => {
    document.getElementById("cap")?.classList.remove("on");
    document.getElementById("cap-scrim")?.classList.remove("on");
  });
  await p.waitForTimeout(500);
}

export async function login(p, email = "admin@gmail.com", pass = "admin123") {
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await p.fill('input[type="email"]', email);
  await p.fill('input[type="password"]', pass);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(7000);
}

/** Log in once in a throwaway context and persist cookies, so recorded
 *  contexts can open straight onto the product. */
export async function saveAuth(b, { email, pass, path = STATE } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1238, height: 784 } });
  const p = await ctx.newPage();
  await login(p, email ?? "admin@gmail.com", pass ?? "admin123");
  await ctx.storageState({ path });
  await ctx.close();
}

export { chromium };
