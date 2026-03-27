import {
  AUTH_UPDATE_PASSWORD_PATH,
  DEFAULT_POST_LOGIN_PATH,
} from "@/lib/auth-redirect-urls";

/** Decode JWT payload (browser-safe, no verify). */
function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Password-recovery sessions often include `amr` with method `recovery` in the access token.
 * Used when PKCE `redirectType` is missing (e.g. storage format without a suffix).
 */
export function jwtIndicatesPasswordRecovery(accessToken: string | undefined): boolean {
  if (!accessToken) return false;
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return false;
  const amr = payload.amr;
  if (!Array.isArray(amr)) return false;
  for (const entry of amr) {
    if (entry === "recovery") return true;
    if (typeof entry === "object" && entry !== null && "method" in entry) {
      const m = String((entry as { method: string }).method).toLowerCase();
      if (m === "recovery") return true;
    }
  }
  return false;
}

/**
 * Where to send the user after `setSession` from URL hash tokens (implicit flow).
 * Aligns with {@link resolvePostPkceRedirect}: `type=recovery` and/or JWT `amr`.
 */
export function resolvePostImplicitHashRedirect(
  flowType: string | null,
  accessToken: string,
): string {
  if (flowType === "recovery") {
    return AUTH_UPDATE_PASSWORD_PATH;
  }
  if (jwtIndicatesPasswordRecovery(accessToken)) {
    return AUTH_UPDATE_PASSWORD_PATH;
  }
  return DEFAULT_POST_LOGIN_PATH;
}

type ExchangeData = {
  redirectType?: string | null;
  session?: { access_token?: string };
};

/**
 * Where to send the user after `exchangeCodeForSession` on `/auth/callback`.
 * Prefer GoTrue's `redirectType` (from PKCE storage), then JWT `amr`, then `?type=`, then `next`.
 */
export function resolvePostPkceRedirect(
  nextFromQuery: string,
  data: ExchangeData | null,
  searchParams: URLSearchParams,
): string {
  if (data?.redirectType === "recovery") {
    return AUTH_UPDATE_PASSWORD_PATH;
  }
  if (jwtIndicatesPasswordRecovery(data?.session?.access_token)) {
    return AUTH_UPDATE_PASSWORD_PATH;
  }
  if (searchParams.get("type") === "recovery") {
    return AUTH_UPDATE_PASSWORD_PATH;
  }
  return nextFromQuery.startsWith("/") ? nextFromQuery : DEFAULT_POST_LOGIN_PATH;
}
