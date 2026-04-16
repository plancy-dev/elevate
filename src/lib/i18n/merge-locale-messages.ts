import type { AbstractIntlMessages } from "next-intl";

/**
 * Deep-merge primary locale messages over English fallback so missing or
 * partially merged keys (e.g. client hydration) never surface as MISSING_MESSAGE.
 */
export function mergeLocaleMessages(
  fallback: AbstractIntlMessages,
  primary: AbstractIntlMessages,
): AbstractIntlMessages {
  return mergeRecursive(
    fallback as Record<string, unknown>,
    primary as Record<string, unknown>,
  ) as AbstractIntlMessages;
}

function mergeRecursive(
  fallback: Record<string, unknown> | undefined,
  primary: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (primary === undefined || primary === null) {
    return fallback !== undefined && fallback !== null ? { ...fallback } : {};
  }
  if (typeof primary !== "object" || Array.isArray(primary)) {
    return primary as unknown as Record<string, unknown>;
  }
  const base =
    fallback !== undefined &&
    fallback !== null &&
    typeof fallback === "object" &&
    !Array.isArray(fallback)
      ? fallback
      : {};
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(primary)) {
    const p = primary[key];
    const f = base[key];
    if (
      p !== null &&
      typeof p === "object" &&
      !Array.isArray(p) &&
      f !== null &&
      typeof f === "object" &&
      !Array.isArray(f)
    ) {
      out[key] = mergeRecursive(f as Record<string, unknown>, p as Record<string, unknown>);
    } else {
      out[key] = p;
    }
  }
  return out;
}
