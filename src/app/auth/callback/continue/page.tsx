import { AuthCallbackClient } from "../auth-callback-client";

export const metadata = { title: "Signing in" };

/**
 * Fragment-only auth (hash tokens) cannot be handled in the sibling route handler because
 * fragments are not sent to the server. The root layout’s hash handler runs here while
 * this page shows a short “Completing sign-in” state.
 */
export default function AuthCallbackContinuePage() {
  return <AuthCallbackClient />;
}
