/**
 * CLI: insert the same demo episodes + artifacts as the dashboard seed (service role).
 *
 * Usage (repo root):
 *   npx tsx scripts/seed-demo-studio-productions.ts
 *
 * Env (e.g. in .env.local — loaded automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STUDIO_DEMO_ORG_ID=<uuid>   OR   STUDIO_DEMO_USER_EMAIL=<login email>
 *
 * Optional:
 *   --force   insert even if this org already has episodes (may duplicate [데모] rows)
 *
 * Examples:
 *   STUDIO_DEMO_USER_EMAIL=you@company.com npx tsx scripts/seed-demo-studio-productions.ts
 *   STUDIO_DEMO_ORG_ID=uuid-here npx tsx scripts/seed-demo-studio-productions.ts --force
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { insertDemoStudioSeedForOrg } from "../src/lib/studio-productions/insert-demo-seed";
import type { Database } from "../src/types/database.types";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const orgIdEnv = process.env.STUDIO_DEMO_ORG_ID?.trim();
const emailEnv = process.env.STUDIO_DEMO_USER_EMAIL?.trim().toLowerCase();
const force = process.argv.includes("--force");

async function main() {
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (load .env.local).",
    );
    process.exit(1);
  }

  if (!orgIdEnv && !emailEnv) {
    console.error(
      "Set STUDIO_DEMO_ORG_ID or STUDIO_DEMO_USER_EMAIL to choose which org receives the demo data.",
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let organizationId: string;
  let createdBy: string | null = null;

  if (orgIdEnv) {
    organizationId = orgIdEnv;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .limit(1)
      .maybeSingle();
    createdBy = profile?.id ?? null;
  } else {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("email", emailEnv as string)
      .maybeSingle();

    if (error) {
      console.error("profiles lookup failed:", error.message);
      process.exit(1);
    }
    if (!profile?.organization_id) {
      console.error(
        `No organization_id for email ${emailEnv}. Is the user onboarded to an org?`,
      );
      process.exit(1);
    }
    organizationId = profile.organization_id;
    createdBy = profile.id;
  }

  const result = await insertDemoStudioSeedForOrg(supabase, {
    organizationId,
    createdBy,
    requireEmpty: !force,
  });

  if (!result.ok && result.reason === "not_empty") {
    console.error(
      "This org already has episodes. Delete them or run with --force to add another demo set.",
    );
    process.exit(2);
  }
  if (!result.ok) {
    console.error("Insert failed (DB error).");
    process.exit(1);
  }

  console.log(
    `OK: inserted ${result.episodeCount} episodes and ${result.artifactCount} artifacts for org ${organizationId}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
