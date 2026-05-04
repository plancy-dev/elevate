import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "../../messages");

function readMessages(file: string): Record<string, unknown> {
  const raw = readFileSync(join(messagesDir, file), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Issue #62 / CREATIVE: TOC section heading and Library nav item must not repeat the same string. */
function getLibraryTocLabels(messages: Record<string, unknown>): {
  section: string;
  library: string;
} {
  const dash = messages.Dashboard as Record<string, unknown> | undefined;
  expect(dash, "Dashboard root").toBeTruthy();
  const toc = dash!.toc as Record<string, unknown> | undefined;
  expect(toc, "Dashboard.toc").toBeTruthy();
  const lib = toc!.library as Record<string, unknown> | undefined;
  expect(lib, "Dashboard.toc.library").toBeTruthy();
  return {
    section: String(lib!.section ?? ""),
    library: String(lib!.library ?? ""),
  };
}

const localeFiles = ["en.json", "ko.json", "ja.json", "zh-CN.json", "zh-TW.json"] as const;

describe("Dashboard.toc.library — section vs item label (#62)", () => {
  it.each(localeFiles)("%s: section and library labels are non-empty and distinct", (file) => {
    const messages = readMessages(file);
    const { section, library } = getLibraryTocLabels(messages);
    expect(section.trim().length, `${file} section`).toBeGreaterThan(0);
    expect(library.trim().length, `${file} library`).toBeGreaterThan(0);
    expect(section, `${file}: section must not equal nav item`).not.toBe(library);
  });
});
