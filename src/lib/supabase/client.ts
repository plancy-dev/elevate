import { createBrowserClient } from "@supabase/ssr";
import { assertPublicSupabaseEnv } from "@/lib/env/public";

export function createClient() {
  const { url, anonKey } = assertPublicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
