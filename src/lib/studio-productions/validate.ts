import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import {
  STUDIO_CONTENT_TEXT_MAX,
  STUDIO_METADATA_JSON_MAX_CHARS,
} from "@/lib/studio-productions/constants";
import type { Json } from "@/types/database.types";

export function validateOptionalHttpsUrl(
  raw: string | null | undefined,
):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  const s = raw?.trim() ?? "";
  if (s === "") return { ok: true, value: null };
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, error: ActionErrorCode.studioInvalidUrl };
    }
    return { ok: true, value: s };
  } catch {
    return { ok: false, error: ActionErrorCode.studioInvalidUrl };
  }
}

export function validateContentText(raw: string):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  if (raw.length > STUDIO_CONTENT_TEXT_MAX) {
    return { ok: false, error: ActionErrorCode.studioTextTooLong };
  }
  return { ok: true, value: raw };
}

export function validateMetadataJson(metadata: Json):
  | { ok: true; value: Json }
  | { ok: false; error: string } {
  const s = JSON.stringify(metadata ?? {});
  if (s.length > STUDIO_METADATA_JSON_MAX_CHARS) {
    return { ok: false, error: ActionErrorCode.studioMetadataTooLarge };
  }
  return { ok: true, value: metadata ?? {} };
}
