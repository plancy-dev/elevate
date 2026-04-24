/**
 * One-off diagnostic: peek at the Studio schema after Phase 1+3 migrations
 * landed, and report what the user has in the live DB today.
 *
 * Usage: node scripts/inspect-studio-db.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supa = createClient(url, key);

function banner(t) {
  console.log(`\n=== ${t} ===`);
}

async function run() {
  // 1. Migration gate: do our new columns/tables exist?
  banner("Schema gates (expect all OK after 038-041)");
  const checks = [
    ["studio_projects.character_bible", async () =>
      supa.from("studio_projects").select("id, character_bible, character_reference_image_url").limit(1),
    ],
    ["studio_scheduled_posts", async () =>
      supa.from("studio_scheduled_posts").select("id").limit(1),
    ],
    ["studio_org_provider_connections (flux_replicate/flux_fal/seedream/buffer allowed)", async () =>
      supa.from("studio_org_provider_connections").select("id, provider").limit(1),
    ],
  ];
  for (const [name, fn] of checks) {
    try {
      const { error } = await fn();
      if (error) console.log(`  [FAIL] ${name}: ${error.code} ${error.message}`);
      else console.log(`  [ OK ] ${name}`);
    } catch (e) {
      console.log(`  [FAIL] ${name}: ${e.message ?? e}`);
    }
  }

  // 2. Org inventory
  banner("Organizations (for smoke test target selection)");
  const { data: orgs } = await supa
    .from("organizations")
    .select("id, name, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  for (const o of orgs ?? []) {
    console.log(`  - ${o.name} (id: ${o.id}) plan=${o.plan}`);
  }

  // 3. Per-org provider credentials saved (lightweight)
  banner("Saved provider credentials (count per provider, org-scoped)");
  const { data: creds } = await supa
    .from("studio_org_provider_connections")
    .select("organization_id, provider, last_verified_at");
  const tally = new Map();
  for (const c of creds ?? []) {
    tally.set(c.provider, (tally.get(c.provider) ?? 0) + 1);
  }
  if (tally.size === 0) console.log("  (none yet)");
  for (const [p, n] of tally.entries()) console.log(`  - ${p}: ${n}`);

  // 4. Episodes and keyframe/clip status
  banner("Recent episodes (top 5)");
  const { data: eps } = await supa
    .from("studio_production_episodes")
    .select("id, title, status, organization_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);
  for (const e of eps ?? []) {
    console.log(`  - "${e.title}" (${e.status}) id=${e.id}`);
  }

  if ((eps ?? []).length > 0) {
    banner("Scene keyframe / scene_clip artifacts across recent episodes");
    const ids = eps.map((e) => e.id);
    const { data: arts } = await supa
      .from("studio_production_artifacts")
      .select("episode_id, artifact_role, tool_platform")
      .in("episode_id", ids);
    const counts = new Map();
    for (const a of arts ?? []) {
      const k = `${a.artifact_role} (${a.tool_platform})`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    if (counts.size === 0) console.log("  (no artifacts on these episodes)");
    else {
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      for (const [k, n] of sorted) console.log(`  - ${k}: ${n}`);
    }
  }

  banner("Scheduled posts (Buffer)");
  const { data: sp } = await supa
    .from("studio_scheduled_posts")
    .select("id, platform, status, scheduled_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if ((sp ?? []).length === 0) console.log("  (none yet)");
  for (const row of sp ?? []) {
    console.log(`  - ${row.platform} ${row.status} @ ${row.scheduled_at}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
