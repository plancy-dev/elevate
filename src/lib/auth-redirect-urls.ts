/**
 * OAuth, email confirmation, and password recovery redirects.
 * URLs must match entries under Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthBrowserOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export function getAuthCallbackUrl(next: string): string {
  return `${getAuthBrowserOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}
