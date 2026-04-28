import type { SupabaseClient } from "@supabase/supabase-js";

export type OAuthProviderId = "google" | "azure";

/**
 * Microsoft Entra (Azure AD) — request standard OIDC scopes plus Graph `User.Read`
 * so the authorization server returns claims Supabase GoTrue can map to an email.
 * If the ID token still lacks `email`, fix **App registration → Token configuration**
 * (optional `email` claim on ID tokens); see `docs/SOCIAL_AUTH.md`.
 */
export const MICROSOFT_ENTRA_OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "https://graph.microsoft.com/User.Read",
].join("");

/**
 * Shared Google / Azure OAuth entry for login and signup flows.
 * Keeps `redirectTo` and Google `queryParams` in one place.
 */
export function signInWithOAuthProvider(
  supabase: SupabaseClient,
  options: {
    provider: OAuthProviderId;
    redirectTo: string;
    /** Google only; both flows use account picker by default. */
    googlePromptSelectAccount?: boolean;
  },
) {
  const { provider, redirectTo, googlePromptSelectAccount = true } = options;

  if (provider === "google") {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        ...(googlePromptSelectAccount
          ? { queryParams: { prompt: "select_account" as const } }
          : {}),
      },
    });
  }

  return supabase.auth.signInWithOAuth({
    provider: "azure",
    options: { redirectTo, scopes: MICROSOFT_ENTRA_OAUTH_SCOPES },
  });
}
