/**
 * Toss Payments JS SDK sometimes throws generic "unknown" errors (e.g. widgets
 * iframe / domain / key issues). Surfacing the raw SDK string is unhelpful; we
 * replace with app copy when we detect those patterns.
 */
export function isUnhelpfulTossClientErrorMessage(message: string): boolean {
  const s = message.trim();
  if (s.length === 0) return true;

  // Korean SDK / UI copy
  if (s.includes("알 수 없") || s.includes("알수없")) return true;

  const low = s.toLowerCase();
  if (low.includes("unknownerror") || low.includes("widgets.unknown")) return true;
  if (low === "unknown" || low === "unknown error") return true;
  if (low.startsWith("unknown ") && low.length < 80) return true;

  return false;
}
