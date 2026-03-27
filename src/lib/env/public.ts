/**
 * Build-time / runtime public Supabase env (NEXT_PUBLIC_*).
 * Use `getPublicSupabaseEnv` in Edge/middleware when missing env should no-op.
 * Use `assertPublicSupabaseEnv` in browser and Node server code for clear dev errors.
 */

export function assertPublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example, set both values from Supabase → Project Settings → API, then restart the dev server.",
    );
  }
  return { url, anonKey };
}

/** Same URL as in `assertPublicSupabaseEnv`, for server-only clients that use the service role key. */
export function assertSupabaseProjectUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.local.example and set it from Supabase → Project Settings → API.",
    );
  }
  return url;
}

export function getPublicSupabaseEnv():
  | { url: string; anonKey: string }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
