/**
 * Suggested `artifact_role` values for Studio Productions (ADR-003).
 * UI offers these via `<datalist>`; DB remains free-text.
 * @see docs/STUDIO_ARTIFACT_ROLES.md
 */
export const STUDIO_SUGGESTED_ARTIFACT_ROLES = [
  "hook",
  "title",
  "script_draft",
  "script",
  "prompt",
  "settings",
  "render_output",
  "compliance_note",
  "other",
] as const;

export type StudioSuggestedArtifactRole =
  (typeof STUDIO_SUGGESTED_ARTIFACT_ROLES)[number];

export const STUDIO_ARTIFACT_ROLE_DATALIST_ID =
  "studio-artifact-role-suggestions";
