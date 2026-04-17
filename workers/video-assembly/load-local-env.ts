/**
 * Next.js loads `.env.local` automatically; `tsx` does not. Apply the same files for local worker runs.
 * Skip on Fly (secrets come from the platform; image has no `.env*` files).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";

if (!process.env.FLY_APP_NAME) {
  const root = process.cwd();
  const localPath = resolve(root, ".env.local");
  const envPath = resolve(root, ".env");
  if (existsSync(localPath)) {
    config({ path: localPath });
  }
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}
