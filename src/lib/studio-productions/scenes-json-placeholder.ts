/**
 * Example shape for the optional scenes JSON field (pipeline textarea).
 * Kept in code: next-intl ICU treats `{…}` in messages as interpolation, so a JSON
 * literal cannot live safely in messages/*.json. Label/hint strings cover localized UX.
 */
export const SCENES_JSON_INPUT_PLACEHOLDER =
  '[{"narration":"…","visual_prompt":"…","duration_seconds":5}]';
