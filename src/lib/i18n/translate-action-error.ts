import { ActionErrorCode, isActionErrorCode } from "@/lib/i18n/action-error-codes";
import { MAX_SETTINGS_TEXT_LEN } from "@/lib/settings-validation";

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
  return t(code);
}
