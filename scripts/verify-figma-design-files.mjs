#!/usr/bin/env node
/**
 * Optional: verify Figma file keys exist via REST API (GET /v1/files/:key).
 * https://developers.figma.com/docs/rest-api/
 *
 * FIGMA_ACCESS_TOKEN unset → exit 0 (skip; safe for CI without secrets).
 * FIGMA_VERIFY_FILE_KEYS — comma-separated keys; default matches .github/DESIGN.md Studio file.
 * Loads `.env.local` when present (same as other repo scripts) so local `pnpm figma:verify` picks up tokens.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
/** Matches canonical file in `.github/DESIGN.md` when `FIGMA_VERIFY_FILE_KEYS` is unset. */
const defaultKey = "qxCqUDg8XcC3bEwuR2ImwV";
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
    if (res.status === 401 || res.status === 403) {
      console.error(
        "[figma:verify] Figma rejected the token (401/403). Renew FIGMA_ACCESS_TOKEN " +
          "(90-day tokens expire; create a new personal access token in Figma account settings) " +
          "and update .env.local / GitHub Actions secret FIGMA_ACCESS_TOKEN.",
      );
    }
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
