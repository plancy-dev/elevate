/**
 * Maps Supabase Auth errors to clearer copy for sign-in / sign-up forms.
 * A 400 on `grant_type=password` usually means wrong credentials or no matching user.
 */
export function formatAuthError(err: { message?: string; status?: number }): string {
  const raw = err.message?.trim() ?? "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("email or password")
  ) {
    return (
      "Invalid email or password. " +
      "If the user already exists in Supabase, set or reset the password under Authentication → Users (or use Forgot password below). " +
      "You do not need to run db:seed-admin; the first dashboard visit can create your org and admin role."
    );
  }

  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Confirm your email before signing in. Check your inbox for the confirmation link from Supabase.";
  }

  if (lower.includes("too many requests") || err.status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }

  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already")
  ) {
    return "This email is already registered. Log in instead, or reset your password.";
  }

  return raw || "Something went wrong. Please try again.";
}
