import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertPublicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const { url, anonKey } = assertPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Component where cookies cannot be set.
            // This can be safely ignored when the proxy refreshes sessions.
          }
        },
      },
    },
  );
}
