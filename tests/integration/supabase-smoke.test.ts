/**
 * Opt-in: run against a real Supabase project (staging / dev).
 *
 *   SUPABASE_INTEGRATION_TEST=1 pnpm test:integration
 *
 * Loads `.env.local` when present so NEXT_PUBLIC_* and SUPABASE_SERVICE_ROLE_KEY
 * match your local setup. CI skips these tests unless you add secrets + env.
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

config({ path: resolve(process.cwd(), ".env.local") });

function integrationEnabled(): boolean {
  return (
    process.env.SUPABASE_INTEGRATION_TEST === "1" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  );
}

describe.skipIf(!integrationEnabled())("Supabase integration (service role)", () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  it("profiles table is readable (no RLS recursion for service role)", async () => {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("organizations table is readable", async () => {
    const { data, error } = await admin
      .from("organizations")
      .select("id")
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
