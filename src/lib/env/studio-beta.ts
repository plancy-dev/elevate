/**
 * When `true`, `/dashboard/studio` requires `profiles.email` (normalized) to exist in
 * `prompt_studio_beta_allowlist`. Default unset/false: placeholder visible to all signed-in users.
 */
export function isStudioBetaAllowlistRequired(): boolean {
  return process.env.STUDIO_BETA_REQUIRE_ALLOWLIST === "true";
}
