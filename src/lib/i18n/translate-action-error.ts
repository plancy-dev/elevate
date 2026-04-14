import { ActionErrorCode, isActionErrorCode } from "@/lib/i18n/action-error-codes";
import { MAX_SETTINGS_TEXT_LEN } from "@/lib/settings-validation";
import {
  STUDIO_CONTENT_TEXT_MAX,
  STUDIO_METADATA_JSON_MAX_CHARS,
  STUDIO_TOPIC_LINE_MAX,
} from "@/lib/studio-productions/constants";

type ActionErrorsTranslate = (
  key: string,
  values?: { max?: number },
) => string;

/**
 * Maps a server action `error` or `success` code string to a localized message.
 * Unknown strings (legacy) are returned as-is.
 */
export function translateActionErrorMessage(
  code: string | undefined,
  t: ActionErrorsTranslate,
): string {
  if (!code) return "";
  if (!isActionErrorCode(code)) return code;
  if (code === ActionErrorCode.settingsTextTooLong) {
    return t("settingsTextTooLong", { max: MAX_SETTINGS_TEXT_LEN });
  }
  if (code === ActionErrorCode.studioTextTooLong) {
    return t("studioTextTooLong", { max: STUDIO_CONTENT_TEXT_MAX });
  }
  if (code === ActionErrorCode.studioMetadataTooLarge) {
    return t("studioMetadataTooLarge", { max: STUDIO_METADATA_JSON_MAX_CHARS });
  }
  if (code === ActionErrorCode.studioTopicLineTooLong) {
    return t("studioTopicLineTooLong", { max: STUDIO_TOPIC_LINE_MAX });
  }
  if (code === ActionErrorCode.studioIntegrationsSecretTooLong) {
    return t("studioIntegrationsSecretTooLong", { max: 8192 });
  }
  return t(code);
}
