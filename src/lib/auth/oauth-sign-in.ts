import type { SupabaseClient } from "@supabase/supabase-js";

export type OAuthProviderId = "google" | "azure";

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
    options: { redirectTo },
  });
}
