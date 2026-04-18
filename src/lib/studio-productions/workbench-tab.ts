export const WORKBENCH_TAB_IDS = ["overview", "episode"] as const;
export type WorkbenchTabId = (typeof WORKBENCH_TAB_IDS)[number];

/** Legacy `?tab=` value before artifacts were merged into the Episode tab. */
export const LEGACY_WORKBENCH_TAB_QUERY = "artifacts" as const;

export function parseWorkbenchTabParam(value: string | null): WorkbenchTabId | null {
  if (value === "overview" || value === "episode") return value;
  if (value === LEGACY_WORKBENCH_TAB_QUERY) return "episode";
  return null;
}

/** Raw search param → active tab (default overview). */
export function resolveWorkbenchTabFromSearchParam(
  value: string | null,
): WorkbenchTabId {
  return parseWorkbenchTabParam(value) ?? "overview";
}
