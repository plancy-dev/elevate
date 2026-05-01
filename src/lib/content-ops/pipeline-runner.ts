import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishContentItemToBlog } from "@/lib/content-ops/blog-publish-adapter";
import { sendNewsletterEmail } from "@/lib/content-ops/newsletter-send-adapter";
import {
  BLOG_TEMPLATE_VERSION,
  NEWSLETTER_TEMPLATE_VERSION,
} from "@/lib/content-ops/locale-template-config";
import { buildDraftsFromActivePacks } from "@/lib/content-ops/packs/pack-registry";
import { evaluateReviewGate } from "@/lib/content-ops/review-gate";
import type { Database } from "@/types/database.types";

type ContentItemRow = Database["public"]["Tables"]["content_items"]["Row"];
type ContentSourceRow = Database["public"]["Tables"]["content_sources"]["Row"];
type SubscriberRow = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];

type FeedEntry = {
  title: string;
  link: string;
  publishedAt: string | null;
};

const MAX_PUBLICATION_ATTEMPTS = 3;
const RETRY_DELAY_MINUTES = 30;
const RESEND_MIN_SEND_INTERVAL_MS = 600;
const RESEND_RATE_LIMIT_RETRY_DELAY_MS = 1200;

type FetchSourceResult =
  | { ok: true; entries: FeedEntry[]; fetchUrl: string }
  | { ok: false; entries: []; fetchUrl: string; error: string };

type PublicationChannel = "email" | "blog";

type RetryState = {
  previousAttemptCount: number;
  nextRetryAt: string | null;
};

type PublicationAttempt = {
  attemptCount: number;
  shouldSkip: boolean;
  nextRetryAt: string | null;
};

function hashSnippet(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function classifyFailureReason(reason: string): string {
  const normalized = reason.trim();
  if (!normalized) return "publish_failed";
  if (normalized === "resend_not_configured") return normalized;
  if (normalized === "newsletter_no_subscribers") return normalized;
  if (normalized.startsWith("rss_fetch_error:")) return normalized;
  if (normalized.startsWith("rss_http_") || normalized === "rss_parse_empty_items") {
    return `rss_fetch_error:${normalized}`;
  }
  return normalized;
}

function dedupeReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.map((reason) => classifyFailureReason(reason))));
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isResendRateLimitError(reason: string): boolean {
  const normalized = reason.toLowerCase();
  return normalized.includes("too many requests") || normalized.includes("rate limit");
}

function addMinutesIso(date: Date, minutes: number): string {
  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function parseNextRetryAt(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const retry = (metadata as Record<string, unknown>).retry;
  if (!retry || typeof retry !== "object" || Array.isArray(retry)) return null;
  const nextRetryAt = (retry as Record<string, unknown>).next_retry_at;
  return typeof nextRetryAt === "string" && nextRetryAt.trim() ? nextRetryAt : null;
}

async function getRetryState(
  contentItemId: string,
  channel: PublicationChannel,
): Promise<RetryState> {
  const admin = createAdminClient();
  const { data: latest } = await admin
    .from("content_publications")
    .select("attempt_count, metadata")
    .eq("content_item_id", contentItemId)
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    previousAttemptCount:
      typeof latest?.attempt_count === "number" && Number.isFinite(latest.attempt_count)
        ? latest.attempt_count
        : 0,
    nextRetryAt: parseNextRetryAt(latest?.metadata),
  };
}

function computePublicationAttempt(
  retryState: RetryState,
  nowIso: string,
  retryFailedOnly: boolean,
): PublicationAttempt {
  const nextAttempt = retryState.previousAttemptCount + 1;
  const retryWindowOpen =
    !retryState.nextRetryAt || new Date(retryState.nextRetryAt).getTime() <= Date.parse(nowIso);

  if (retryFailedOnly && !retryWindowOpen) {
    return {
      attemptCount: retryState.previousAttemptCount,
      shouldSkip: true,
      nextRetryAt: retryState.nextRetryAt,
    };
  }
  if (retryState.previousAttemptCount >= MAX_PUBLICATION_ATTEMPTS) {
    return {
      attemptCount: retryState.previousAttemptCount,
      shouldSkip: true,
      nextRetryAt: retryState.nextRetryAt,
    };
  }
  return { attemptCount: nextAttempt, shouldSkip: false, nextRetryAt: null };
}

function buildRetryMetadata(params: {
  attemptCount: number;
  nowIso: string;
  maxAttempts?: number;
}): { max_attempts: number; next_retry_at: string | null } {
  const maxAttempts = params.maxAttempts ?? MAX_PUBLICATION_ATTEMPTS;
  const nextRetryAt =
    params.attemptCount < maxAttempts
      ? addMinutesIso(new Date(params.nowIso), RETRY_DELAY_MINUTES)
      : null;
  return {
    max_attempts: maxAttempts,
    next_retry_at: nextRetryAt,
  };
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

  const generated = buildDraftsFromActivePacks({ sourceBullets: digestLines });
  const { data: newsletterItem, error: nErr } = await admin
    .from("content_items")
    .insert({
      type: "newsletter",
      title: generated.newsletter.title,
      locale: "en",
      summary: generated.newsletter.summary,
      body_markdown: generated.newsletter.bodyMarkdown,
      status: "draft",
      metadata: {
        generate: {
          run_id: runId,
          mode: "pack_registry",
          pack_version: generated.resolved.activeVersion,
          pack_versions: generated.resolved.versions,
          topic_strategy_id: generated.resolved.topic.id,
        },
      },
    })
    .select("id")
    .single();

  if (nErr || !newsletterItem?.id) return { createdItems: 0 };

  const { data: blogItem, error: bErr } = await admin
    .from("content_items")
    .insert({
      type: "blog",
      title: generated.blog.title,
      locale: "en",
      summary: generated.blog.summary,
      body_markdown: generated.blog.bodyMarkdown,
      status: "draft",
      metadata: {
        generate: {
          run_id: runId,
          mode: "pack_registry",
          pack_version: generated.resolved.activeVersion,
          pack_versions: generated.resolved.versions,
          topic_strategy_id: generated.resolved.topic.id,
        },
      },
    })
    .select("id")
    .single();

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
    if (!bErr && blogItem?.id) {
      await admin.from("content_item_source_map").insert({
        content_item_id: blogItem.id,
        source_id: map.source_id,
        source_url: map.source_url,
        source_title: map.source_title,
        source_published_at: map.source_published_at,
        snippet_hash: hashSnippet(
          `generated:${blogItem.id}:${map.source_id}:${map.source_url}`,
        ),
      });
    }
  }

  return { createdItems: bErr || !blogItem?.id ? 1 : 2 };
}

export async function runReviewGatePipeline(runId: string): Promise<{
  scannedCount: number;
  failedCount: number;
  passedCount: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  const { data: candidates } = await admin
    .from("content_items")
    .select("id, title, body_markdown, status, metadata, updated_at")
    .in("status", ["draft", "review_required"])
    .order("updated_at", { ascending: false })
    .limit(200);

  let scannedCount = 0;
  let failedCount = 0;
  let passedCount = 0;
  const failureMessages: string[] = [];

  for (const item of candidates ?? []) {
    scannedCount += 1;
    const { count: sourceLinkCount } = await admin
      .from("content_item_source_map")
      .select("id", { count: "exact", head: true })
      .eq("content_item_id", item.id);

    const gate = evaluateReviewGate({
      bodyMarkdown: item.body_markdown ?? "",
      sourceLinkCount: sourceLinkCount ?? 0,
    });

    const nextMetadata = {
      ...((item.metadata ?? {}) as Record<string, unknown>),
      review_gate: {
        latest: {
          run_id: runId,
          checked_at: new Date().toISOString(),
          passed: gate.passed,
          reasons: gate.reasons,
          metrics: gate.metrics,
        },
      },
    };

    if (!gate.passed) {
      failedCount += 1;
      failureMessages.push(
        `[${item.id}] ${gate.reasons.join("|") || "review_gate_failed"} (${item.title})`,
      );
      await admin
        .from("content_items")
        .update({
          status: "review_required",
          review_notes: `review_gate:${gate.reasons.join(",")}`,
          metadata: nextMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      continue;
    }

    passedCount += 1;
    await admin
      .from("content_items")
      .update({
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  return {
    scannedCount,
    failedCount,
    passedCount,
    failureMessages: failureMessages.slice(0, 20),
  };
}

async function publishNewsletterItem(item: ContentItemRow): Promise<{
  ok: boolean;
  sentCount: number;
  failedCount: number;
  failedReasons: string[];
  attemptCount: number;
  skipped: boolean;
}> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const retryState = await getRetryState(item.id, "email");
  const attempt = computePublicationAttempt(
    retryState,
    nowIso,
    item.status === "send_failed",
  );
  if (attempt.shouldSkip) {
    return {
      ok: false,
      sentCount: 0,
      failedCount: 0,
      failedReasons: ["retry_exhausted"],
      attemptCount: attempt.attemptCount,
      skipped: true,
    };
  }

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
    const classified = "newsletter_no_subscribers";
    const retry = buildRetryMetadata({ attemptCount: attempt.attemptCount, nowIso });
    await admin.from("content_publications").insert({
      content_item_id: item.id,
      channel: "email",
      status: "failed",
      provider: "resend",
      attempt_count: attempt.attemptCount,
      last_error: classified,
      processed_at: nowIso,
      metadata: {
        sent_count: 0,
        failed_count: 1,
        failed_reasons: [classified],
        template_version: NEWSLETTER_TEMPLATE_VERSION,
        retry,
      },
    });
    return {
      ok: false,
      sentCount,
      failedCount: 1,
      failedReasons: [classified],
      attemptCount: attempt.attemptCount,
      skipped: false,
    };
  }

  const subscriberRows = (subscribers ?? []) as SubscriberRow[];
  let previousSendAt: number | null = null;
  for (const subscriber of subscriberRows) {
    if (previousSendAt) {
      const elapsed = Date.now() - previousSendAt;
      if (elapsed < RESEND_MIN_SEND_INTERVAL_MS) {
        await sleep(RESEND_MIN_SEND_INTERVAL_MS - elapsed);
      }
    }

    let send = await sendNewsletterEmail({
      to: subscriber.email,
      subject: item.title,
      markdownBody: item.body_markdown,
      locale: subscriber.locale,
    });
    previousSendAt = Date.now();
    if (!send.ok && isResendRateLimitError(send.error)) {
      await sleep(RESEND_RATE_LIMIT_RETRY_DELAY_MS);
      send = await sendNewsletterEmail({
        to: subscriber.email,
        subject: item.title,
        markdownBody: item.body_markdown,
        locale: subscriber.locale,
      });
      previousSendAt = Date.now();
    }

    if (send.ok) {
      sentCount += 1;
    } else {
      const classified = classifyFailureReason(send.error);
      failedCount += 1;
      failedReasons.push(classified);
      if (classified === "resend_not_configured") {
        failedCount += subscribers.length - sentCount - failedCount;
        break;
      }
    }
  }

  const dedupedReasons = dedupeReasons(failedReasons);
  const publicationStatus = failedCount > 0 ? "failed" : "sent";
  const retry =
    failedCount > 0
      ? buildRetryMetadata({ attemptCount: attempt.attemptCount, nowIso })
      : { max_attempts: MAX_PUBLICATION_ATTEMPTS, next_retry_at: null };
  await admin.from("content_publications").insert({
    content_item_id: item.id,
    channel: "email",
    status: publicationStatus,
    provider: "resend",
    attempt_count: attempt.attemptCount,
    last_error:
      failedCount > 0
        ? `newsletter_send_failed:${dedupedReasons.slice(0, 3).join("|")}`
        : null,
    processed_at: nowIso,
    metadata: {
      sent_count: sentCount,
      failed_count: failedCount,
      failed_reasons: dedupedReasons.slice(0, 10),
      template_version: NEWSLETTER_TEMPLATE_VERSION,
      retry,
    },
  });

  return {
    ok: failedCount === 0,
    sentCount,
    failedCount,
    failedReasons: dedupedReasons,
    attemptCount: attempt.attemptCount,
    skipped: false,
  };
}

async function publishBlogItem(item: ContentItemRow): Promise<{
  ok: boolean;
  error?: string;
  attemptCount: number;
  skipped: boolean;
}> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const retryState = await getRetryState(item.id, "blog");
  const attempt = computePublicationAttempt(
    retryState,
    nowIso,
    item.status === "send_failed",
  );
  if (attempt.shouldSkip) {
    return { ok: false, error: "retry_exhausted", attemptCount: attempt.attemptCount, skipped: true };
  }

  const published = await publishContentItemToBlog({
    locale: item.locale,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    bodyMarkdown: item.body_markdown,
  });
  if (!published.ok) {
    const classified = classifyFailureReason(published.error);
    const retry = buildRetryMetadata({ attemptCount: attempt.attemptCount, nowIso });
    await admin.from("content_publications").insert({
      content_item_id: item.id,
      channel: "blog",
      status: "failed",
      provider: "internal",
      attempt_count: attempt.attemptCount,
      last_error: classified,
      processed_at: nowIso,
      metadata: {
        retry,
        failed_reasons: [classified],
        template_version: BLOG_TEMPLATE_VERSION,
      },
    });
    return { ok: false, error: classified, attemptCount: attempt.attemptCount, skipped: false };
  }

  await admin.from("content_items").update({ slug: published.slug }).eq("id", item.id);
  await admin.from("content_publications").insert({
    content_item_id: item.id,
    channel: "blog",
    status: "published",
    provider: "internal",
    attempt_count: attempt.attemptCount,
    processed_at: nowIso,
    metadata: {
      file_path: published.filePath,
      template_version: BLOG_TEMPLATE_VERSION,
      retry: { max_attempts: MAX_PUBLICATION_ATTEMPTS, next_retry_at: null },
    },
  });
  return { ok: true, attemptCount: attempt.attemptCount, skipped: false };
}

export async function runPublishPipeline(params?: {
  contentItemId?: string;
  retryFailedOnly?: boolean;
}): Promise<{
  processedCount: number;
  failedCount: number;
  sentCount: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  let query = admin
    .from("content_items")
    .select("*")
    .in(
      "status",
      params?.retryFailedOnly
        ? ["send_failed", "publishing"]
        : ["approved", "scheduled", "publishing"],
    )
    .order("updated_at", { ascending: true })
    .limit(50);

  if (params?.contentItemId) {
    query = query.eq("id", params.contentItemId);
  }

  const { data: items } = await query;
  let processedCount = 0;
  let failedCount = 0;
  let sentCount = 0;
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

    if (blogResult?.skipped || newsletterResult?.skipped) {
      const skipReason = blogResult?.error ?? newsletterResult?.failedReasons[0] ?? "retry_exhausted";
      failureMessages.push(`[${item.type}:${item.id}] ${skipReason}`);
      await admin
        .from("content_items")
        .update({ status: "send_failed", updated_at: new Date().toISOString() })
        .eq("id", item.id);
      processedCount += 1;
      failedCount += 1;
      continue;
    }

    const success = (blogResult?.ok ?? true) && (newsletterResult?.ok ?? true);
    if (newsletterResult?.ok) {
      sentCount += newsletterResult.sentCount;
    }
    if (!success) {
      if (blogResult && !blogResult.ok) {
        failureMessages.push(`[blog:${item.id}] ${classifyFailureReason(blogResult.error ?? "publish_failed")}`);
      }
      if (newsletterResult && !newsletterResult.ok) {
        const classified = dedupeReasons(newsletterResult.failedReasons);
        failureMessages.push(
          `[newsletter:${item.id}] ${classified.slice(0, 3).join("|") || "send_failed"}`,
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
    sentCount,
    failureMessages: failureMessages.slice(0, 20),
  };
}
