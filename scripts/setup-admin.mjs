// One-off/reusable utility: create a confirmed admin user directly via the
// service role key, bypassing the dashboard "Add user" + manual SQL promote
// flow. Usage: node scripts/setup-admin.mjs <email> <password>
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envPath = new URL("../.env.local", import.meta.url);
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: boards, error: boardsError } = await supabase.from("boards").select("id").limit(1);
if (boardsError) {
  console.log("SCHEMA_MISSING:", boardsError.message);
  process.exit(1);
}
console.log(`SCHEMA_OK (found ${boards.length ? "at least one" : "zero"} board row)`);

const [, , email, password] = process.argv;
if (!email || !password) {
  console.log("Usage: node scripts/setup-admin.mjs <email> <password>");
  process.exit(0);
}

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: email.split("@")[0] },
});

if (createError) {
  console.log("CREATE_USER_ERROR:", createError.message);
  process.exit(1);
}
console.log("USER_CREATED:", created.user.id);

const { error: promoteError } = await supabase
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", created.user.id);

if (promoteError) {
  console.log("PROMOTE_ERROR:", promoteError.message);
  process.exit(1);
}
console.log("PROMOTED_TO_ADMIN:", email);
