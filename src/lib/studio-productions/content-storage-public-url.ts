/**
 * Parses Supabase Storage public object URLs into bucket + object path.
 * @see https://supabase.com/docs/guides/storage/serving/downloads
 */
export function parseSupabaseStoragePublicUrl(
  urlString: string,
): { bucket: string; objectPath: string } | null {
  try {
    const u = new URL(urlString);
    const marker = "/storage/v1/object/public/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return null;
    const after = u.pathname.slice(i + marker.length);
    const slash = after.indexOf("/");
    if (slash === -1) return null;
    const bucket = after.slice(0, slash);
    const objectPath = decodeURIComponent(after.slice(slash + 1));
    return { bucket, objectPath };
  } catch {
    return null;
  }
}
