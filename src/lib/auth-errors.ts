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

/**
 * `signInWithPassword` — Supabase often returns a generic "Invalid login credentials"
 * for wrong password, unconfirmed email, or edge cases after a reset.
 */
export function formatSignInPasswordError(err: { message: string }): string {
  const raw = err.message ?? "";
  const lower = raw.toLowerCase();
  if (isAuthEmailRateLimited(raw)) {
    return formatAuthError(err);
  }
  if (
    lower.includes("email not confirmed") ||
    lower.includes("email address not confirmed")
  ) {
    return (
      "This email is not confirmed. In Supabase: Authentication → Providers → Email — either turn off “Confirm email” for testing, or open the confirmation link from the signup email. Password sign-in is blocked until the email is confirmed."
    );
  }
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password")
  ) {
    return (
      "That email and password don’t match what the server has. Check Caps Lock and try again. " +
      "If you just finished a password reset, confirm you’re using the new password. " +
      "If it still fails: Supabase → Authentication → Users → open this user and confirm the email is verified, or use “Send password recovery” / set a temporary password from the dashboard."
    );
  }
  return formatAuthError(err);
}

/** Forgot-password / `resetPasswordForEmail` — same limit, copy mentions reset emails. */
export function formatAuthEmailDeliveryError(err: { message: string }): string {
  const raw = err.message ?? "";
  if (isAuthEmailRateLimited(raw)) {
    return "Too many reset emails were sent recently, so sending is temporarily blocked. Wait an hour or so, then try again. Repeated clicks and dashboard “Send password recovery” also count toward this limit.";
  }
  return raw;
}

/** OAuth redirect errors surfaced as `?auth_error=` on the login page. */
export function formatOAuthCallbackError(
  code: string,
  description: string | null,
  errorCode?: string | null,
): string {
  const d = description?.replace(/\+/g, " ").trim() ?? "";
  if (
    errorCode === "otp_expired" ||
    (code === "access_denied" &&
      /(invalid or has expired|email link)/i.test(d))
  ) {
    return (
      "This password reset or email link has expired or was already used. " +
      "Request a new reset from Forgot password and open the latest email link within about an hour."
    );
  }
  if (code === "access_denied") {
    return "Sign-in was cancelled. Try again when you’re ready.";
  }
  if (/space/i.test(d) || /client/i.test(d)) {
    return "Provider configuration failed. In Supabase: Google Client IDs must have no spaces (comma-separated only). Check Azure Client ID, secret Value, and Tenant URL.";
  }
  if (d.length > 0) return d;
  return `Sign-in failed (${code}). Check Google and Microsoft settings in Supabase and your provider consoles.`;
}
