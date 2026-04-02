import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "../../messages");

function loadJson(name: string): unknown {
  const raw = readFileSync(join(messagesDir, name), "utf8");
  return JSON.parse(raw) as unknown;
}

/** Flatten object leaves to dot paths like "Dashboard.signOut" */
function collectLeafPaths(
  value: unknown,
  prefix = "",
): string[] {
  if (value === null || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }
  if (Array.isArray(value)) {
    const paths: string[] = [];
    value.forEach((item, i) => {
      paths.push(...collectLeafPaths(item, `${prefix}[${i}]`));
    });
    return paths;
  }
  const paths: string[] = [];
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      paths.push(...collectLeafPaths(v, next));
    } else {
      paths.push(next);
    }
  }
  return paths;
}

describe("messages locale parity (en is source of truth)", () => {
  const en = loadJson("en.json") as Record<string, unknown>;
  const enPaths = new Set(collectLeafPaths(en));

  const locales = ["ko.json", "ja.json", "zh-CN.json", "zh-TW.json"] as const;

  it.each(locales)("%s has every leaf path that en.json has", (file) => {
    const data = loadJson(file) as Record<string, unknown>;
    const paths = collectLeafPaths(data);
    const set = new Set(paths);
    const missing = [...enPaths].filter((p) => !set.has(p));
    expect(missing, `Missing keys in ${file}`).toEqual([]);
  });

  it.each(locales)("%s has no extra leaf paths vs en.json", (file) => {
    const data = loadJson(file) as Record<string, unknown>;
    const paths = collectLeafPaths(data);
    const set = new Set(paths);
    const extra = [...set].filter((p) => !enPaths.has(p));
    expect(extra, `Extra keys in ${file}`).toEqual([]);
  });
});
