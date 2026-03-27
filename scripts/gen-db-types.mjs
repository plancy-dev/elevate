/**
 * Regenerates `src/types/database.types.ts` from the linked Supabase project.
 * Requires `.env.local` with `NEXT_PUBLIC_PROJECT_ID` (or parseable `NEXT_PUBLIC_SUPABASE_URL`).
 */
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const fromUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
  /^https:\/\/([^.]+)\.supabase\.co/,
)?.[1];
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? fromUrl;

if (!projectId) {
  console.error(
    "Set NEXT_PUBLIC_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL in .env.local",
  );
  process.exit(1);
}

const out = "src/types/database.types.ts";
execSync(
  `npx supabase gen types typescript --project-id "${projectId}" > "${out}"`,
  { stdio: "inherit", shell: "/bin/sh" },
);
console.log(`Wrote ${out}`);
