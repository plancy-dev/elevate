import { createBrowserClient } from "@supabase/ssr";
import { assertPublicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

export function createClient() {
  const { url, anonKey } = assertPublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
