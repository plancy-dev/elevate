/**
 * Maps Supabase Auth API errors to clearer copy for the UI.
 * See https://supabase.com/docs/guides/auth/rate-limits
 */
function isAuthEmailRateLimited(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("email rate limit")
  );
}

/** Sign-in, sign-up, OAuth, and other auth calls that may return 429 on email sends. */
export function formatAuthError(err: { message: string }): string {
  const raw = err.message ?? "";
  if (isAuthEmailRateLimited(raw)) {
    return "Too many authentication emails were sent recently, so sending is temporarily blocked. Wait an hour or so, then try again.";
  }
  return raw;
}

/** Forgot-password / `resetPasswordForEmail` — same limit, copy mentions reset emails. */
export function formatAuthEmailDeliveryError(err: { message: string }): string {
  const raw = err.message ?? "";
  if (isAuthEmailRateLimited(raw)) {
    return "Too many reset emails were sent recently, so sending is temporarily blocked. Wait an hour or so, then try again. Repeated clicks and dashboard “Send password recovery” also count toward this limit.";
  }
  return raw;
}
