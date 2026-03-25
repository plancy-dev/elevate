/**
 * One-off admin user via Supabase Auth Admin API (not raw SQL — portable across Supabase versions).
 *
 * Usage (from repo root, with .env.local loaded manually or env vars set):
 *
 *   export $(grep -v '^#' .env.local | xargs)   # optional: load .env.local in bash
 *   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='secure-password-here' node scripts/seed-admin.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
if (!email || !password) {
  console.error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. ADMIN_EMAIL=a@b.com ADMIN_PASSWORD='...' node scripts/seed-admin.mjs)",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "Administrator" },
});

if (error) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}

const userId = data.user?.id;
if (!userId) {
  console.error("No user id returned.");
  process.exit(1);
}

const { error: profileErr } = await supabase
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", userId);

if (profileErr) {
  console.error("profiles update failed:", profileErr.message);
  process.exit(1);
}

console.log("OK — admin user created:", email);
console.log("Sign in at /login with email & password.");
console.log(
  "First dashboard visit will attach a default organization if needed.",
);
