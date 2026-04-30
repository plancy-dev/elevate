import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishContentItemToBlog } from "@/lib/content-ops/blog-publish-adapter";
import { sendNewsletterEmail } from "@/lib/content-ops/newsletter-send-adapter";
import type { Database } from "@/types/database.types";

type ContentItemRow = Database["public"]["Tables"]["content_items"]["Row"];
type ContentSourceRow = Database["public"]["Tables"]["content_sources"]["Row"];
type SubscriberRow = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];

type FeedEntry = {
  title: string;
  link: string;
  publishedAt: string | null;
};

type FetchSourceResult =
  | { ok: true; entries: FeedEntry[]; fetchUrl: string }
  | { ok: false; entries: []; fetchUrl: string; error: string };

function hashSnippet(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function stripXmlCdata(input: string): string {
  return input
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .trim();
}

function parseRssItems(xml: string, maxItems = 10): FeedEntry[] {
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  const items: FeedEntry[] = [];
  for (const m of matches.slice(0, maxItems)) {
    const chunk = m[1];
    const title = stripXmlCdata(
      chunk.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "Untitled",
    );
    const link = stripXmlCdata(
      chunk.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "",
    );
    const publishedAtRaw = stripXmlCdata(
      chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "",
    );
    if (!link) continue;
    const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null;
    items.push({ title, link, publishedAt });
  }
  return items;
}

async function fetchSourceEntries(source: ContentSourceRow): Promise<FetchSourceResult> {
  const target =
    source.kind === "rss" ? source.rss_url?.trim() || source.base_url : source.base_url;
  if (!target) return { ok: false, entries: [], fetchUrl: "", error: "missing_source_url" };

  try {
    const res = await fetch(target, {
      headers: {
        "user-agent": "ElevateContentOps/1.0 (+https://elevate.ai.kr)",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        ok: false,
        entries: [],
        fetchUrl: target,
        error: `rss_http_${res.status}`,
      };
    }
    const xml = await res.text();
    const entries = parseRssItems(xml, 8);
    if (entries.length === 0) {
      return {
        ok: false,
        entries: [],
        fetchUrl: target,
        error: "rss_parse_empty_items",
      };
    }
    return { ok: true, entries, fetchUrl: target };
  } catch (e) {
    return {
      ok: false,
      entries: [],
      fetchUrl: target,
      error: e instanceof Error ? `rss_fetch_error:${e.message}` : "rss_fetch_error",
    };
  }
}

export async function runIngestPipeline(runId: string): Promise<{
  createdItems: number;
  scannedSources: number;
  failedSources: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  const { data: sources } = await admin
    .from("content_sources")
    .select("*")
    .eq("is_active", true)
    .order("trust_weight", { ascending: false })
    .limit(25);

  let createdItems = 0;
  let scannedSources = 0;
  let failedSources = 0;
  const failureMessages: string[] = [];
  for (const source of (sources ?? []) as ContentSourceRow[]) {
    scannedSources += 1;
    const fetchResult = await fetchSourceEntries(source);
    if (!fetchResult.ok) {
      failedSources += 1;
      failureMessages.push(
        `[${source.name}] ${fetchResult.error}${fetchResult.fetchUrl ? ` (${fetchResult.fetchUrl})` : ""}`,
      );
      continue;
    }

    for (const entry of fetchResult.entries) {
      const snippetHash = hashSnippet(`${source.id}:${entry.link}:${entry.title}`);
      const { data: exists } = await admin
        .from("content_item_source_map")
        .select("id")
        .eq("snippet_hash", snippetHash)
        .limit(1)
        .maybeSingle();
      if (exists?.id) continue;

      const { data: created, error: createErr } = await admin
        .from("content_items")
        .insert({
          type: "newsletter",
          title: entry.title.slice(0, 200),
          locale: source.locale || "en",
          summary: `Ingested from ${source.name}`,
          body_markdown: `- Source: ${source.name}\n- Link: ${entry.link}\n\nDraft note:\n${entry.title}`,
          source_quality_score: source.trust_weight,
          status: "draft",
          metadata: {
            ingest: {
              run_id: runId,
              source_id: source.id,
            },
          },
        })
        .select("id")
        .single();

      if (createErr || !created?.id) continue;

      await admin.from("content_item_source_map").insert({
        content_item_id: created.id,
        source_id: source.id,
        source_url: entry.link,
        source_title: entry.title,
        source_published_at: entry.publishedAt,
        snippet_hash: snippetHash,
      });
      createdItems += 1;
    }
  }

  return {
    createdItems,
    scannedSources,
    failedSources,
    failureMessages: failureMessages.slice(0, 15),
  };
}

export async function runDraftGeneratePipeline(runId: string): Promise<{
  createdItems: number;
}> {
  const admin = createAdminClient();
  const { data: latestMaps } = await admin
    .from("content_item_source_map")
    .select("source_id, source_url, source_title, source_published_at")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!latestMaps || latestMaps.length === 0) {
    return { createdItems: 0 };
  }

  const digestLines = latestMaps.map((m, index) => {
    const title = m.source_title?.trim() || "Untitled source";
    return `${index + 1}. [${title}](${m.source_url})`;
  });

  const digestBody = [
    "## Daily AI Digest",
    "",
    "Curated updates from active sources:",
    "",
    ...digestLines,
  ].join("\n");

  const digestTitle = `Daily AI Digest — ${new Date().toISOString().slice(0, 10)}`;
  const { data: newsletterItem, error: nErr } = await admin
    .from("content_items")
    .insert({
      type: "newsletter",
      title: digestTitle,
      locale: "en",
      summary: "Auto-generated digest draft from recent source ingest.",
      body_markdown: digestBody,
      status: "draft",
      metadata: {
        generate: {
          run_id: runId,
          mode: "digest",
        },
      },
    })
    .select("id")
    .single();

  if (nErr || !newsletterItem?.id) return { createdItems: 0 };

  for (const map of latestMaps) {
    await admin.from("content_item_source_map").insert({
      content_item_id: newsletterItem.id,
      source_id: map.source_id,
      source_url: map.source_url,
      source_title: map.source_title,
      source_published_at: map.source_published_at,
      snippet_hash: hashSnippet(
        `generated:${newsletterItem.id}:${map.source_id}:${map.source_url}`,
      ),
    });
  }

  return { createdItems: 1 };
}

async function publishNewsletterItem(item: ContentItemRow): Promise<{
  ok: boolean;
  sentCount: number;
  failedCount: number;
  failedReasons: string[];
}> {
  const admin = createAdminClient();
  const { data: subscribers } = await admin
    .from("newsletter_subscribers")
    .select("*")
    .eq("status", "subscribed")
    .order("created_at", { ascending: false })
    .limit(200);

  let sentCount = 0;
  let failedCount = 0;
  const failedReasons: string[] = [];
  if (!subscribers || subscribers.length === 0) {
    await admin.from("content_publications").insert({
      content_item_id: item.id,
      channel: "email",
      status: "failed",
      provider: "resend",
      attempt_count: 0,
      last_error: "newsletter_no_subscribers",
      processed_at: new Date().toISOString(),
    });
    return {
      ok: false,
      sentCount,
      failedCount: 1,
      failedReasons: ["newsletter_no_subscribers"],
    };
  }

  for (const subscriber of (subscribers ?? []) as SubscriberRow[]) {
    const send = await sendNewsletterEmail({
      to: subscriber.email,
      subject: item.title,
      markdownBody: item.body_markdown,
      locale: subscriber.locale,
    });
    if (send.ok) {
      sentCount += 1;
    } else {
      failedCount += 1;
      failedReasons.push(send.error);
    }
  }

  const publicationStatus = failedCount > 0 ? "failed" : "sent";
  await admin.from("content_publications").insert({
    content_item_id: item.id,
    channel: "email",
    status: publicationStatus,
    provider: "resend",
    attempt_count: sentCount + failedCount,
    last_error:
      failedCount > 0
        ? `newsletter_send_failed:${Array.from(new Set(failedReasons)).slice(0, 3).join("|")}`
        : null,
    processed_at: new Date().toISOString(),
    metadata: {
      sent_count: sentCount,
      failed_count: failedCount,
      failed_reasons: Array.from(new Set(failedReasons)).slice(0, 10),
    },
  });

  return {
    ok: failedCount === 0,
    sentCount,
    failedCount,
    failedReasons: Array.from(new Set(failedReasons)),
  };
}

async function publishBlogItem(item: ContentItemRow): Promise<{
  ok: boolean;
  error?: string;
}> {
  const admin = createAdminClient();
  const published = await publishContentItemToBlog({
    locale: item.locale,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    bodyMarkdown: item.body_markdown,
  });
  if (!published.ok) {
    await admin.from("content_publications").insert({
      content_item_id: item.id,
      channel: "blog",
      status: "failed",
      provider: "internal",
      attempt_count: 1,
      last_error: published.error,
      processed_at: new Date().toISOString(),
    });
    return { ok: false, error: published.error };
  }

  await admin.from("content_items").update({ slug: published.slug }).eq("id", item.id);
  await admin.from("content_publications").insert({
    content_item_id: item.id,
    channel: "blog",
    status: "published",
    provider: "internal",
    attempt_count: 1,
    processed_at: new Date().toISOString(),
    metadata: { file_path: published.filePath },
  });
  return { ok: true };
}

export async function runPublishPipeline(params?: {
  contentItemId?: string;
}): Promise<{
  processedCount: number;
  failedCount: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  let query = admin
    .from("content_items")
    .select("*")
    .in("status", ["approved", "scheduled", "publishing"])
    .order("updated_at", { ascending: true })
    .limit(50);

  if (params?.contentItemId) {
    query = query.eq("id", params.contentItemId);
  }

  const { data: items } = await query;
  let processedCount = 0;
  let failedCount = 0;
  const failureMessages: string[] = [];
  const now = Date.now();

  for (const item of (items ?? []) as ContentItemRow[]) {
    if (
      !params?.contentItemId &&
      item.status === "scheduled" &&
      (!item.scheduled_at || new Date(item.scheduled_at).getTime() > now)
    ) {
      continue;
    }

    await admin
      .from("content_items")
      .update({ status: "publishing", updated_at: new Date().toISOString() })
      .eq("id", item.id);

    const blogResult = item.type === "blog" ? await publishBlogItem(item) : null;
    const newsletterResult =
      item.type === "newsletter" ? await publishNewsletterItem(item) : null;

    const success = (blogResult?.ok ?? true) && (newsletterResult?.ok ?? true);
    if (!success) {
      if (blogResult && !blogResult.ok) {
        failureMessages.push(`[blog:${item.id}] ${blogResult.error ?? "publish_failed"}`);
      }
      if (newsletterResult && !newsletterResult.ok) {
        failureMessages.push(
          `[newsletter:${item.id}] ${newsletterResult.failedReasons.slice(0, 3).join("|") || "send_failed"}`,
        );
      }
    }

    await admin
      .from("content_items")
      .update({
        status: success ? "published" : "send_failed",
        published_at: success ? new Date().toISOString() : item.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    processedCount += 1;
    if (!success) failedCount += 1;
  }

  return {
    processedCount,
    failedCount,
    failureMessages: failureMessages.slice(0, 20),
  };
}
