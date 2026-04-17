#!/usr/bin/env node
/**
 * Optional: verify Figma file keys exist via REST API (GET /v1/files/:key).
 * https://developers.figma.com/docs/rest-api/
 *
 * FIGMA_ACCESS_TOKEN unset → exit 0 (skip; safe for CI without secrets).
 * FIGMA_VERIFY_FILE_KEYS — comma-separated keys; default matches .github/DESIGN.md Studio file.
 */

const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
const defaultKey = "qxCQUDg8XcCBewuR2lmwV";
const keys = (process.env.FIGMA_VERIFY_FILE_KEYS || defaultKey)
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

if (!token) {
  console.log(
    "[figma:verify] FIGMA_ACCESS_TOKEN not set — skipping (add token for local or CI check).",
  );
  process.exit(0);
}

let failed = false;
for (const key of keys) {
  const res = await fetch(`https://api.figma.com/v1/files/${key}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(
      `[figma:verify] ${key} → HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
    failed = true;
    continue;
  }
  const json = await res.json();
  console.log(`[figma:verify] OK ${key} — ${json.name ?? "(no name)"}`);
}

process.exit(failed ? 1 : 0);
