/**
 * After `exchangeCodeForSession` fails, `getSession()` may still return a user from an
 * unrelated prior session (another tab, stale cookies). Redirecting that user to `next`
 * (often `/dashboard`) is incorrect for PKCE storage misses.
 *
 * Only allow "recover" redirects when the error plausibly means the auth *code* was already
 * consumed while a valid session exists (e.g. duplicate callback / race).
 */
export function shouldAllowPkceErrorSessionRecovery(errMessage: string): boolean {
  const m = errMessage.toLowerCase();
  if (
    m.includes("code verifier not found") ||
    m.includes("verifier was not found") ||
    (m.includes("code verifier") && m.includes("not found"))
  ) {
    return false;
  }
  if (
    m.includes("invalid_grant") ||
    m.includes("already been used") ||
    m.includes("already used") ||
    (m.includes("authorization code") && m.includes("invalid"))
  ) {
    return true;
  }
  return false;
}

/** True when the client never had the PKCE verifier for this redirect (wrong device/tab, cleared storage). */
export function isPkceVerifierMissingError(errMessage: string): boolean {
  const m = errMessage.toLowerCase();
  return (
    m.includes("code verifier not found") ||
    m.includes("verifier was not found") ||
    (m.includes("code verifier") && m.includes("not found"))
  );
}
