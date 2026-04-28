import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { hasE2ELoginCredentials } from "./helpers/credentials";
import { ensureEpisodeTabsHydrated } from "./helpers/hydration-guard";
import { loginAsTestUser } from "./helpers/login";

const PREFERRED_EPISODE_ID =
  process.env.E2E_EPISODE_ID || "dae6d22a-2eda-4050-8b18-48506e8a8561";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supa() {
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

async function resolveEpisodeId() {
  const preferred = PREFERRED_EPISODE_ID.trim();
  if (preferred) {
    const { data } = await supa()
      .from("studio_production_episodes")
      .select("id")
      .eq("id", preferred)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: latest } = await supa()
    .from("studio_production_episodes")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return latest?.id ?? null;
}

async function countRows(
  table: "studio_video_assembly_jobs" | "studio_production_artifacts" | "studio_scheduled_posts",
  match: Record<string, string>,
) {
  let q = supa().from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(match)) {
    q = q.eq(k, v);
  }
  const { count, error } = await q;
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function poll<T>(
  label: string,
  timeoutMs: number,
  intervalMs: number,
  fn: () => Promise<T | null>,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const v = await fn();
    if (v != null) return v;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out: ${label}`);
}

async function requireVisibleBufferChannelChip(page: import("@playwright/test").Page) {
  const noChannelsHint = page.getByText(
    /(No Buffer channels are visible|Buffer 채널이 없습니다|채널을 연결하세요)/i,
  );
  if (await noChannelsHint.isVisible().catch(() => false)) {
    return null;
  }
  const channelChip = page
    .locator("button:visible")
    .filter({ hasText: /instagram|tiktok|youtube|threads|facebook|linkedin|x/i })
    .first();
  const visible = await channelChip.isVisible().catch(() => false);
  if (!visible) return null;
  return channelChip;
}

test.describe("LIVE smoke: phase2(export) + phase3(buffer)", () => {
  test.skip(!hasE2ELoginCredentials(), "Need E2E credentials");
  test.setTimeout(8 * 60 * 1000);

  test("editor export then buffer schedule", async ({ page }) => {
    const episodeId = await resolveEpisodeId();
    test.skip(
      episodeId === null,
      "No studio episodes available; set E2E_EPISODE_ID or seed an episode.",
    );

    await loginAsTestUser(page);

    // ----- Step 3: editor export -------------------------------------------
    const jobsBefore = await countRows("studio_video_assembly_jobs", {
      episode_id: episodeId!,
    });
    const assembledBefore = await countRows("studio_production_artifacts", {
      episode_id: episodeId!,
      artifact_role: "assembled_video",
    });
    console.log(
      `[STEP3] before jobs=${jobsBefore}, assembled_video=${assembledBefore}`,
    );

    await page.goto(`/dashboard/productions/${episodeId!}/editor`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("[data-editor-shell]")).toBeVisible();

    const addOverlay = page
      .getByRole("button", { name: /(텍스트|Add text|Add)/i })
      .first();
    await expect(addOverlay).toBeVisible();
    await addOverlay.click();
    const overlayTextarea = page.locator("aside textarea").first();
    await expect(overlayTextarea).toBeVisible();
    await overlayTextarea.fill("E2E export verification overlay");

    const exportButton = page
      .getByRole("button", { name: /^(내보내기|Export)$/i })
      .first();
    await expect(exportButton).toBeVisible();
    await exportButton.click();
    await page.getByRole("button", { name: /^(렌더|Render)$/i }).click();

    await poll("assembly job inserted", 60_000, 5_000, async () => {
      const n = await countRows("studio_video_assembly_jobs", {
        episode_id: episodeId!,
      });
      return n > jobsBefore ? n : null;
    });

    const jobsAfter = await countRows("studio_video_assembly_jobs", {
      episode_id: episodeId!,
    });
    console.log(`[STEP3] after jobs=${jobsAfter}`);
    expect(jobsAfter).toBeGreaterThan(jobsBefore);

    await poll("assembled video generated", 90_000, 10_000, async () => {
      const n = await countRows("studio_production_artifacts", {
        episode_id: episodeId!,
        artifact_role: "assembled_video",
      });
      return n > assembledBefore ? n : null;
    });
    const assembledAfter = await countRows("studio_production_artifacts", {
      episode_id: episodeId!,
      artifact_role: "assembled_video",
    });
    console.log(`[STEP3] after assembled_video=${assembledAfter}`);
    expect(assembledAfter).toBeGreaterThan(assembledBefore);

    // ----- Step 4: buffer schedule -----------------------------------------
    const scheduledBefore = await countRows("studio_scheduled_posts", {
      episode_id: episodeId!,
    });
    console.log(`[STEP4] before scheduled_posts=${scheduledBefore}`);

    await page.goto(`/dashboard/productions/${episodeId!}?tab=episode`, {
      waitUntil: "domcontentloaded",
    });
    await ensureEpisodeTabsHydrated(page, "episode");
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/productions/${episodeId!}`),
    );

    const genCaptions = page
      .getByRole("button", { name: /(AI로 생성|Generate with AI|Generate)/i })
      .first();
    await expect(genCaptions).toBeVisible();
    await genCaptions.click();

    const channelChip = await requireVisibleBufferChannelChip(page);
    if (channelChip === null) {
      test.skip(
        true,
        "Buffer scheduling prerequisite missing: no connected Buffer channels visible for this org/test user.",
      );
      return;
    }
    await channelChip.click();

    const scheduleButton = page
      .getByRole("button", { name: /(예약|Schedule)/i })
      .first();
    await expect(scheduleButton).toBeVisible();
    await scheduleButton.click();

    await poll("scheduled post inserted", 90_000, 5_000, async () => {
      const n = await countRows("studio_scheduled_posts", {
        episode_id: episodeId!,
      });
      return n > scheduledBefore ? n : null;
    });

    const scheduledAfter = await countRows("studio_scheduled_posts", {
      episode_id: episodeId!,
    });
    console.log(`[STEP4] after scheduled_posts=${scheduledAfter}`);
    expect(scheduledAfter).toBeGreaterThan(scheduledBefore);

    console.log("[EVIDENCE] reproducible path:");
    console.log(`- /dashboard/productions/${episodeId!}/editor`);
    console.log(`- /dashboard/productions/${episodeId!}`);
  });
});

