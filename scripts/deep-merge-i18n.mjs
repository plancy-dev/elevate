#!/usr/bin/env node
/**
 * Deep-merges messages/patch-<locale>.json into messages/<locale>.json
 * Usage: node scripts/deep-merge-i18n.mjs en
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const locale = process.argv[2] || "en";
const basePath = path.join(__dirname, `../messages/${locale}.json`);
const patchPath = path.join(__dirname, `../messages/patch-${locale}.json`);

function deepMerge(target, source) {
  if (source === undefined || source === null) return target;
  if (Array.isArray(source)) return source.slice();
  if (typeof source !== "object") return source;
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target?.[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

if (!fs.existsSync(patchPath)) {
  console.error("Missing patch file:", patchPath);
  process.exit(1);
}

const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
const patch = JSON.parse(fs.readFileSync(patchPath, "utf8"));
const merged = deepMerge(base, patch);
fs.writeFileSync(basePath, JSON.stringify(merged, null, 2) + "\n");
console.log("Merged patch into", basePath);
