/**
 * OAuth, email confirmation, password recovery, and magic-link redirects.
 * URLs must match entries under Supabase → Authentication → URL Configuration → Redirect URLs.
 *
 * Prefer `/auth/callback` (not the site root) so PKCE and fragments behave predictably; the
 * middleware also forwards `/?code=...` from the Site URL root to this path.
 */
export const AUTH_CALLBACK_PATH = "/auth/callback" as const;
export const AUTH_UPDATE_PASSWORD_PATH = "/auth/update-password" as const;
export const DEFAULT_POST_LOGIN_PATH = "/dashboard" as const;

export type LoginAuthErrorInput = {
  error: string;
  errorCode?: string | null;
  errorDescription?: string | null;
  /** If set and not `/dashboard`, appended as `next` for post-login redirect. */
  next?: string | null;
};

/**
 * Absolute callback URL for Supabase `redirectTo` / `emailRedirectTo` (browser or server).
 */
export function buildAuthCallbackUrl(origin: string, nextPath: string): string {
  const base = origin.replace(/\/$/, "");
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${base}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}`;
}

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
  if (input.next && input.next !== DEFAULT_POST_LOGIN_PATH) {
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

/** Browser or server: callback URL with `next` path (e.g. `/dashboard`, `/auth/update-password`). */
export function getAuthCallbackUrl(next: string): string {
  return buildAuthCallbackUrl(getAuthBrowserOrigin(), next);
}
