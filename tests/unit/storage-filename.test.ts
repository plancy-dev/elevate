import { describe, expect, it } from "vitest";
import {
  buildCatalogStorageObjectPath,
  downloadFilenameFromStoragePath,
  normalizeOriginalFileNameForDb,
  safeExtensionForStorage,
} from "@/lib/content/storage-filename";

describe("normalizeOriginalFileNameForDb", () => {
  it("preserves Korean and common Unicode in the basename", () => {
    expect(normalizeOriginalFileNameForDb("  보고서 2024.pdf  ")).toBe("보고서 2024.pdf");
  });

  it("blocks path segments and null bytes", () => {
    expect(normalizeOriginalFileNameForDb("a/b\\c.pdf")).toBe("a_b_c.pdf");
    expect(normalizeOriginalFileNameForDb("x\0y.pdf")).toBe("xy.pdf");
  });
});

describe("buildCatalogStorageObjectPath", () => {
  it("uses ASCII-only slug segment and uuid file name (no Hangul in path)", () => {
    const p = buildCatalogStorageObjectPath("test2", "pdf");
    expect(p).toMatch(/^ebooks\/test2\/\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/);
  });

  it("normalizes extension", () => {
    expect(safeExtensionForStorage("PDF")).toBe("pdf");
    expect(safeExtensionForStorage("epub")).toBe("epub");
  });
});

describe("downloadFilenameFromStoragePath", () => {
  it("strips leading timestamp from leaf", () => {
    expect(
      downloadFilenameFromStoragePath("ebooks/foo/1739284-my-book.pdf"),
    ).toBe("my-book.pdf");
  });

  it("returns uuid-based leaf for new storage layout", () => {
    const leaf = downloadFilenameFromStoragePath(
      "ebooks/foo/1739284-550e8400-e29b-41d4-a716-446655440000.pdf",
    );
    expect(leaf).toBe("550e8400-e29b-41d4-a716-446655440000.pdf");
  });

  it("returns full leaf when no timestamp prefix", () => {
    expect(downloadFilenameFromStoragePath("bucket/legacy.pdf")).toBe("legacy.pdf");
  });
});
