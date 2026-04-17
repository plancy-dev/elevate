#!/usr/bin/env node
/**
 * One-off: GET /v1/files/:key and print page/canvas + first frame URLs for DESIGN.md / issues.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
const fileKey =
  process.env.FIGMA_VERIFY_FILE_KEYS?.split(",")[0]?.trim() || "qxCQUDg8XcCBewuR2lmwV";

if (!token) {
  console.error("FIGMA_ACCESS_TOKEN required");
  process.exit(1);
}

function nodeIdToParam(id) {
  return String(id).replace(/:/g, "-");
}

function walkForFirstFrame(node, depth = 0) {
  if (!node || depth > 30) return null;
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

const pages = [];
for (const canvas of doc.children ?? []) {
  if (canvas.type !== "CANVAS") continue;
  const firstFrame = walkForFirstFrame(canvas);
  const target = firstFrame || canvas;
  pages.push({
    name: canvas.name,
    id: target.id,
    url: `https://www.figma.com/design/${fileKey}/${fileNameSlug}?node-id=${nodeIdToParam(target.id)}`,
  });
}

console.log(JSON.stringify({ fileKey, fileName: file.name, pages }, null, 2));
