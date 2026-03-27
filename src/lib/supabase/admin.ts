import { createClient } from "@supabase/supabase-js";
import { assertSupabaseProjectUrl } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

/**
 * Server-only client with elevated privileges. Never import in Client Components.
 */
export function createAdminClient() {
  const url = assertSupabaseProjectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (server-only; never expose to the client).",
    );
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
