#!/usr/bin/env node
/**
 * Lists shareable Figma design URLs (`node-id=`) via GET /v1/files/:key — no manual copy from the UI.
 *
 * Usage:
 *   pnpm figma:list-links              # JSON (default)
 *   pnpm figma:list-links --markdown   # Markdown table for DESIGN.md / issues
 *   pnpm figma:list-links --frames     # Every FRAME in the file with path (pick representative links)
 *
 * Requires FIGMA_ACCESS_TOKEN and optional FIGMA_VERIFY_FILE_KEYS (see .env.local.example).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
const fileKey =
  process.env.FIGMA_VERIFY_FILE_KEYS?.split(",")[0]?.trim() || "qxCqUDg8XcC3bEwuR2ImwV";

const args = process.argv.slice(2);
const markdown = args.includes("--markdown") || args.includes("-m");
const allFrames = args.includes("--frames") || args.includes("-f");

if (!token) {
  console.error("[figma:list-links] FIGMA_ACCESS_TOKEN required (.env.local)");
  process.exit(1);
}

function nodeIdToParam(id) {
  return String(id).replace(/:/g, "-");
}

function walkForFirstFrame(node, depth = 0) {
  if (!node || depth > 40) return null;
  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
    return node;
  }
  if (node.children) {
    for (const c of node.children) {
      const f = walkForFirstFrame(c, depth + 1);
      if (f) return f;
    }
  }
  return null;
}

/** Every FRAME with a human path (for picking `node-id` links without the Figma UI). */
function walkFrames(node, pageName, prefix, out) {
  if (!node) return;
  if (node.type === "FRAME") {
    const path = prefix ? `${prefix} › ${node.name}` : String(node.name ?? "");
    out.push({ pageName, path, id: node.id });
    for (const c of node.children || []) walkFrames(c, pageName, path, out);
    return;
  }
  for (const c of node.children || []) walkFrames(c, pageName, prefix, out);
}

const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
  headers: { "X-Figma-Token": token },
});
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
const file = await res.json();
const doc = file.document;
const fileNameSlug = encodeURIComponent(
  (file.name || "file").replace(/\s+/g, "-").slice(0, 80),
);

function fileUrl(nodeId) {
  return `https://www.figma.com/design/${fileKey}/${fileNameSlug}?node-id=${nodeIdToParam(nodeId)}`;
}

if (allFrames) {
  const rows = [];
  for (const canvas of doc.children ?? []) {
    if (canvas.type !== "CANVAS") continue;
    for (const child of canvas.children || []) walkFrames(child, canvas.name, "", rows);
  }
  console.log(`# Frames in "${file.name}" (${rows.length})\n`);
  for (const r of rows) {
    console.log(`- **${r.pageName}** — ${r.path}`);
    console.log(`  ${fileUrl(r.id)}\n`);
  }
  process.exit(0);
}

const pages = [];
for (const canvas of doc.children ?? []) {
  if (canvas.type !== "CANVAS") continue;
  const firstFrame = walkForFirstFrame(canvas);
  const target = firstFrame || canvas;
  pages.push({
    name: canvas.name,
    id: target.id,
    url: fileUrl(target.id),
  });
}

if (markdown) {
  console.log("| Page (canvas) | Representative link |");
  console.log("|---------------|---------------------|");
  for (const p of pages) {
    console.log(`| ${p.name} | ${p.url} |`);
  }
  console.log("\n_Copy `node-id=` URLs into `.github/DESIGN.md` or GitHub issues._");
  process.exit(0);
}

console.log(JSON.stringify({ fileKey, fileName: file.name, pages }, null, 2));
