/**
 * Catalog file naming:
 * - **Storage object key**: ASCII-only (`ebooks/{slug}/{timestamp}-{uuid}.{ext}`) so S3/Supabase
 *   never mangles Unicode in paths.
 * - **Human name**: `content_products.original_file_name` (UTF-8, 한글 OK) for downloads & UI.
 */
import { randomUUID } from "node:crypto";

const MAX_ORIGINAL_LEN = 255;

/** Store in DB as the user-facing original download name (Hangul/CJK allowed). */
export function normalizeOriginalFileNameForDb(raw: string): string {
  const t = raw.trim().replace(/\0/g, "");
  const noPath = t.replace(/[/\\]/g, "_").replace(/\r|\n|\t/g, " ");
  const collapsed = noPath.replace(/\s+/g, " ").trim();
  const out = collapsed.slice(0, MAX_ORIGINAL_LEN);
  return out || "download.bin";
}

/** Allowed extension for the object key (pdf, epub, zip). */
export function safeExtensionForStorage(ext: string): string {
  const e = ext.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (e === "pdf" || e === "epub" || e === "zip") return e;
  return e.length >= 2 && e.length <= 8 ? e : "bin";
}

/**
 * Stable, ASCII-only Storage path — does not embed the client filename (avoids `_.pdf` when
 * Unicode is mishandled in transit or by legacy sanitizers).
 */
export function buildCatalogStorageObjectPath(slug: string, ext: string): string {
  const safeExt = safeExtensionForStorage(ext);
  return `ebooks/${slug}/${Date.now()}-${randomUUID()}.${safeExt}`;
}

/**
 * Legacy / fallback: derive a filename from the object key when `original_file_name` is null.
 * New keys look like `{timestamp}-{uuid}.pdf` (no Korean in path).
 */
export function downloadFilenameFromStoragePath(storagePath: string): string {
  const leaf = storagePath.split("/").pop()?.trim() ?? "";
  const stripped = /^\d+-(.+)$/.exec(leaf);
  const candidate = stripped?.[1] ?? leaf;
  return candidate.replace(/\0/g, "").slice(0, MAX_ORIGINAL_LEN) || "download.bin";
}
