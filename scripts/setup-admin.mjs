#!/usr/bin/env node
/**
 * Bootstrap the first admin. Every other admin is created from Settings inside
 * the app, but the first one has no admin to create it — this is that door.
 *
 *   node scripts/setup-admin.mjs you@example.com "a-strong-password" "Your Name"
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName] = process.argv.slice(2);
if (!email || !password) {
  console.error('usage: node scripts/setup-admin.mjs <email> <password> ["Full Name"]');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId;
const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName ?? email },
});

if (error) {
  if (!/already|registered|exists/i.test(error.message)) {
    console.error("could not create user:", error.message);
    process.exit(1);
  }
  // already exists — find them and promote instead
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found) {
    console.error("user exists but could not be found to promote");
    process.exit(1);
  }
  userId = found.id;
  console.log("user already existed — promoting");
} else {
  userId = data.user.id;
  console.log("auth user created");
}

const { error: upErr } = await db
  .from("profiles")
  .update({ role: "admin", status: "approved", full_name: fullName ?? email })
  .eq("id", userId);

if (upErr) {
  console.error("could not promote profile:", upErr.message);
  process.exit(1);
}

console.log(`✓ ${email} is now an approved admin`);
