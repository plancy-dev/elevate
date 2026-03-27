/** 2-letter initials for a display name (e.g. sidebar avatar). */
export function getInitialsFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase() || "?";
}
