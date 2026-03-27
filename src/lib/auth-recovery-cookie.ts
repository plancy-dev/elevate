/**
 * Hint cookie: Supabase may refresh the session in middleware and drop `amr: recovery`
 * from the JWT, so server-side JWT inspection alone is unreliable for password-reset flows.
 * The client sets this when it knows the user is in a recovery flow (PKCE/hash/callback).
 */

import type { NextRequest } from "next/server";

export const AUTH_RECOVERY_PENDING_COOKIE = "elevate_pw_recovery";

const MAX_AGE_SEC = 3600;

function secureSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

/** Call before navigating to `/auth/update-password` or when `redirectType === "recovery"`. */
export function setRecoveryPendingClient(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_RECOVERY_PENDING_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secureSuffix()}`;
}

export function clearRecoveryPendingClient(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_RECOVERY_PENDING_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureSuffix()}`;
}

export function hasRecoveryPendingCookie(request: NextRequest): boolean {
  return request.cookies.get(AUTH_RECOVERY_PENDING_COOKIE)?.value === "1";
}
