import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const adminRoot = join(process.cwd(), "src/app/(admin)/admin");

function collectTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsxFiles(next));
      continue;
    }
    if (entry.isFile() && next.endsWith(".tsx")) {
      out.push(next);
    }
  }
  return out;
}

type Finding = {
  file: string;
  snippet: string;
};

function collectHardcodedFindings(filePath: string): Finding[] {
  const source = readFileSync(filePath, "utf8");
  const findings: Finding[] = [];

  // Text nodes that should usually be wrapped in t("...").
  const textNodeRegex = />\s*([A-Za-z가-힣一-龥ぁ-んァ-ン][^<>{}\n]*)\s*</g;
  for (const match of source.matchAll(textNodeRegex)) {
    const raw = (match[1] ?? "").trim();
    if (!raw) continue;
    if (/^(UTC|JSON|RSS|API)$/i.test(raw)) continue;
    if (/^[A-Za-z0-9_=./:-]+$/.test(raw)) continue; // machine-like tokens
    findings.push({
      file: relative(process.cwd(), filePath),
      snippet: raw,
    });
  }

  // Human-facing attributes that should also use translations.
  const attrRegex = /\b(placeholder|title|aria-label)\s*=\s*"([^"]*[A-Za-z][^"]*)"/g;
  for (const match of source.matchAll(attrRegex)) {
    const raw = (match[2] ?? "").trim();
    if (!raw) continue;
    if (/^https?:\/\//.test(raw)) continue;
    findings.push({
      file: relative(process.cwd(), filePath),
      snippet: `${match[1]}="${raw}"`,
    });
  }

  return findings;
}

describe("admin i18n guard", () => {
  it("has no hardcoded user-facing text in admin TSX pages", () => {
    const files = collectTsxFiles(adminRoot);
    const findings = files.flatMap((file) => collectHardcodedFindings(file));
    expect(
      findings,
      `Hardcoded admin text detected:\n${findings.map((f) => `- ${f.file}: ${f.snippet}`).join("\n")}`,
    ).toEqual([]);
  });
});

