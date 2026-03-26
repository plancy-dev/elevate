/**
 * One-off admin user via Supabase Auth Admin API (not raw SQL — portable across Supabase versions).
 *
 * Usage (from repo root, with .env.local loaded manually or env vars set):
 *
 *   export $(grep -v '^#' .env.local | xargs)   # optional: load .env.local in bash
 *   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='secure-password-here' node scripts/seed-admin.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * If the user already exists, this script resets their password and sets role=admin (dev convenience).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailRaw = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
if (!emailRaw || !password) {
  console.error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. ADMIN_EMAIL=a@b.com ADMIN_PASSWORD='...' node scripts/seed-admin.mjs)",
  );
  process.exit(1);
}

const email = emailRaw.trim().toLowerCase();

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function looksLikeDuplicateUser(error) {
  if (!error?.message) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("already") ||
    m.includes("registered") ||
    m.includes("exists") ||
    m.includes("duplicate")
  );
}

async function findUserIdByEmail() {
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("listUsers failed:", error.message);
      process.exit(1);
    }
    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === email);
    if (match?.id) return match.id;
    if (users.length < perPage) break;
  }
  return null;
}

let userId;

const { data: created, error: createErr } = await supabase.auth.admin.createUser(
  {
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Administrator" },
  },
);

if (createErr && looksLikeDuplicateUser(createErr)) {
  console.log("User already exists — updating password and admin role…");
  userId = await findUserIdByEmail();
  if (!userId) {
    console.error(
      "Could not find user by email after duplicate error:",
      createErr.message,
    );
    process.exit(1);
  }
  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (updErr) {
    console.error("updateUserById failed:", updErr.message);
    process.exit(1);
  }
} else if (createErr) {
  console.error("createUser failed:", createErr.message);
  process.exit(1);
} else {
  userId = created.user?.id;
}

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

console.log("OK — admin user ready:", email);
console.log("Sign in at /login with email & password.");
console.log(
  "First dashboard visit will attach a default organization if needed.",
);
