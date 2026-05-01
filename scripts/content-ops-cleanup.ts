import dotenv from "dotenv";
import {
  CONTENT_OPS_RUNTIME,
  CONTENT_OPS_US_ET_SCHEDULE,
} from "@/lib/content-ops/automation-config";
import { createAdminClient } from "@/lib/supabase/admin";

dotenv.config({ path: ".env.local" });
const DRY_RUN = process.argv.includes("--dry-run");

async function cleanupSmokeFixtures() {
  const admin = createAdminClient();

  const { data: smokeSources } = await admin
    .from("content_sources")
    .select("id, name")
    .ilike("name", "[SMOKE]%");
  const sourceIds = (smokeSources ?? []).map((row) => row.id);

  let deletedMapRows = 0;
  let deletedItems = 0;
  let deletedPublications = 0;
  const { data: mappedItemRows } =
    sourceIds.length > 0
      ? await admin
          .from("content_item_source_map")
          .select("content_item_id")
          .in("source_id", sourceIds)
      : { data: [] as { content_item_id: string }[] };
  const contentItemIds = Array.from(
    new Set((mappedItemRows ?? []).map((row) => row.content_item_id)),
  );

  if (sourceIds.length > 0 && !DRY_RUN) {
    if (contentItemIds.length > 0) {
      const { count: pubCount } = await admin
        .from("content_publications")
        .delete({ count: "exact" })
        .in("content_item_id", contentItemIds);
      deletedPublications = pubCount ?? 0;
    }

    const { count: mapCount } = await admin
      .from("content_item_source_map")
      .delete({ count: "exact" })
      .in("source_id", sourceIds);
    deletedMapRows = mapCount ?? 0;

    if (contentItemIds.length > 0) {
      const { count: itemCount } = await admin
        .from("content_items")
        .delete({ count: "exact" })
        .in("id", contentItemIds);
      deletedItems = itemCount ?? 0;
    }
  }

  if (DRY_RUN) {
    const [
      smokeBlogRows,
      subscriberRows,
      runRows,
      mappedRows,
      publicationRows,
      sourceRows,
    ] = await Promise.all([
      admin
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .contains("metadata", { smoke_fixture: true }),
      admin
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("source", "smoke_fixture"),
      admin
        .from("content_runs")
        .select("id", { count: "exact", head: true })
        .contains("metadata", { smoke_fixture: true }),
      sourceIds.length > 0
        ? admin
            .from("content_item_source_map")
            .select("id", { count: "exact", head: true })
            .in("source_id", sourceIds)
        : Promise.resolve({ count: 0 } as { count: number }),
      contentItemIds.length > 0
        ? admin
            .from("content_publications")
            .select("id", { count: "exact", head: true })
            .in("content_item_id", contentItemIds)
        : Promise.resolve({ count: 0 } as { count: number }),
      sourceIds.length > 0
        ? admin
            .from("content_sources")
            .select("id", { count: "exact", head: true })
            .in("id", sourceIds)
        : Promise.resolve({ count: 0 } as { count: number }),
    ]);

    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          check: "content-ops-cleanup",
          runtime: CONTENT_OPS_RUNTIME,
          etSchedule: CONTENT_OPS_US_ET_SCHEDULE,
          wouldDelete: {
            deletedSources: sourceRows.count ?? 0,
            deletedMapRows: mappedRows.count ?? 0,
            deletedItems: contentItemIds.length,
            deletedPublications: publicationRows.count ?? 0,
            deletedSmokeBlogs: smokeBlogRows.count ?? 0,
            deletedSubscribers: subscriberRows.count ?? 0,
            deletedRuns: runRows.count ?? 0,
          },
          note: "No rows were deleted.",
        },
        null,
        2,
      ),
    );
    return;
  }

  const { count: deletedSmokeBlogs } = await admin
    .from("content_items")
    .delete({ count: "exact" })
    .contains("metadata", { smoke_fixture: true });

  const { count: deletedSubscribers } = await admin
    .from("newsletter_subscribers")
    .delete({ count: "exact" })
    .eq("source", "smoke_fixture");

  const { count: deletedRuns } = await admin
    .from("content_runs")
    .delete({ count: "exact" })
    .contains("metadata", { smoke_fixture: true });

  const { count: deletedSources } = await admin
    .from("content_sources")
    .delete({ count: "exact" })
    .in("id", sourceIds);

  console.log(
    JSON.stringify(
      {
        deletedSources: deletedSources ?? 0,
        deletedMapRows,
        deletedItems,
        deletedPublications,
        deletedSmokeBlogs: deletedSmokeBlogs ?? 0,
        deletedSubscribers: deletedSubscribers ?? 0,
        deletedRuns: deletedRuns ?? 0,
      },
      null,
      2,
    ),
  );
}

cleanupSmokeFixtures().catch((error) => {
  console.error("[content-ops-cleanup] failed:", error);
  process.exit(1);
});
