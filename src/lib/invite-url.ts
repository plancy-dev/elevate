/** Absolute invite link for sharing (uses NEXT_PUBLIC_APP_URL). */
export function inviteAbsoluteUrl(token: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const base = raw.replace(/\/$/, "");
  if (!base) return `/invite?token=${encodeURIComponent(token)}`;
  return `${base}/invite?token=${encodeURIComponent(token)}`;
}
