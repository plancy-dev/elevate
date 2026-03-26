/**
 * OAuth, email confirmation, and password recovery redirects.
 * URLs must match entries under Supabase → Authentication → URL Configuration → Redirect URLs.
 *
 * Use `/auth/callback` (not the site root) for recovery so the URL hash is not lost when
 * next-intl redirects `/` → `/[locale]`.
 */
export const AUTH_UPDATE_PASSWORD_PATH = "/auth/update-password" as const;

export type LoginAuthErrorInput = {
  error: string;
  errorCode?: string | null;
  errorDescription?: string | null;
  /** If set and not `/dashboard`, appended as `next` for post-login redirect. */
  next?: string | null;
};

/**
 * Path + query for `/login` after an auth failure (OAuth query or hash fragment).
 */
export function getLoginPathWithAuthError(
  origin: string,
  input: LoginAuthErrorInput,
): string {
  const login = new URL("/login", origin);
  login.searchParams.set("auth_error", input.error);
  if (input.errorCode) {
    login.searchParams.set("auth_error_code", input.errorCode);
  }
  if (input.errorDescription) {
    login.searchParams.set(
      "auth_error_description",
      input.errorDescription.slice(0, 500),
    );
  }
  if (input.next && input.next !== "/dashboard") {
    login.searchParams.set("next", input.next);
  }
  return login.pathname + login.search;
}

export function getAuthBrowserOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export function getAuthCallbackUrl(next: string): string {
  return `${getAuthBrowserOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}
