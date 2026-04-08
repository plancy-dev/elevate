export const WORKBENCH_TAB_IDS = ["overview", "episode", "artifacts"] as const;
export type WorkbenchTabId = (typeof WORKBENCH_TAB_IDS)[number];

export function parseWorkbenchTabParam(value: string | null): WorkbenchTabId | null {
  if (value === "overview" || value === "episode" || value === "artifacts") {
    return value;
  }
  return null;
}
