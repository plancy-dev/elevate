import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";

dotenv.config({ path: ".env.local" });

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

  if (sourceIds.length > 0) {
    const { data: mappedItemRows } = await admin
      .from("content_item_source_map")
      .select("content_item_id")
      .in("source_id", sourceIds);
    const contentItemIds = Array.from(
      new Set((mappedItemRows ?? []).map((row) => row.content_item_id)),
    );

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
