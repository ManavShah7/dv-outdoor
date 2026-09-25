import { chromium, saveAuth, STATE, FIELD_STATE } from "./rec.mjs";
const b = await chromium.launch();
await saveAuth(b, { path: STATE });
await saveAuth(b, { email: "bharat@dvoutdoor.in", pass: "field1234", path: FIELD_STATE });
await b.close();
console.log("saved both");
