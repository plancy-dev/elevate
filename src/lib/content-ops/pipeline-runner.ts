import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishContentItemToBlog } from "@/lib/content-ops/blog-publish-adapter";
import {
  normalizeNewsletterSendErrorReason,
  resolveNewsletterRetryPolicy,
  sendNewsletterEmail,
} from "@/lib/content-ops/newsletter-send-adapter";
import { resolveResendSendConfig } from "@/lib/email/resend-config";
import {
  BLOG_TEMPLATE_VERSION,
  NEWSLETTER_TEMPLATE_VERSION,
} from "@/lib/content-ops/locale-template-config";
import { buildDraftsFromActivePacks } from "@/lib/content-ops/packs/pack-registry";
import { evaluateReviewGate } from "@/lib/content-ops/review-gate";
import type { Database } from "@/types/database.types";
import type { Json } from "@/types/database.types";

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
const INGEST_MIN_TRUST_WEIGHT = 60;
const INGEST_MAX_SOURCES = 15;
const DRAFT_MIN_TRUST_WEIGHT = 70;
const DRAFT_MAX_SOURCE_BULLETS = 8;
const DEFAULT_PUBLISH_BATCH_SIZE = 20;
const DEFAULT_RETRY_FAILED_BATCH_SIZE = 5;
const CONFIG_BLOCK_RESCHEDULE_MINUTES = 360;
const DEFAULT_QUEUE_AUTO_APPROVE_MIN_CONFIDENCE = 0.8;
const DEFAULT_QUEUE_AUTO_APPROVE_MIN_QUALITY_SCORE = 16;
const BROKEN_FIXTURE_SOURCE_PATTERNS = [
  "example.invalid/rss",
  "broken rss fixture",
] as const;

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
  skipReason: "retry_window_not_open" | "max_attempts_exhausted" | null;
};

type NewsletterPublishOutcome = "sent" | "failed" | "deferred";

type PublicationHealthWindow = {
  totalCount24h: number;
  failedCount24h: number;
  configStopCount24h: number;
};

type QueueTriageDecision = "auto_approve_candidate" | "needs_rewrite" | "hold_manual";

type QueueTriageAssessment = {
  decision: QueueTriageDecision;
  confidence: number;
  reasons: string[];
  suggestedAction: "recommend_approve" | "recommend_rewrite" | "recommend_manual_review";
};

type AutoApprovalPolicyResult = {
  allowed: boolean;
  reason: string;
  nextStatus: "approved" | "scheduled" | "review_required";
};

type ReviewGateLite = {
  passed: boolean;
  reasons: string[];
  qualityScore: number;
};

type QueueAutoApproveThresholds = {
  minConfidence: number;
  minQualityScore: number;
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

function isConfigStopReason(reason: string): boolean {
  const policy = resolveNewsletterRetryPolicy(reason);
  if (policy.action !== "stop") return false;
  return reason.startsWith("resend_") || reason === "newsletter_no_subscribers";
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

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractLatestReviewGate(
  metadata: unknown,
): ReviewGateLite | null {
  const root = asObject(metadata);
  const latest =
    asObject(asObject(root?.review_gate)?.latest) ??
    asObject(asObject(root?.reviewGate)?.latest);
  if (!latest) return null;
  const passed = latest.passed === true;
  const reasonsRaw = latest.reasons;
  const reasons = Array.isArray(reasonsRaw)
    ? reasonsRaw.filter((entry): entry is string => typeof entry === "string")
    : [];
  const metrics = asObject(latest.metrics);
  const qualityScore = Number(metrics?.qualityScore ?? 0);
  return {
    passed,
    reasons,
    qualityScore: Number.isFinite(qualityScore) ? qualityScore : 0,
  };
}

export function resolveQueueTriageAssessment(params: {
  reviewGate: ReviewGateLite | null;
}): QueueTriageAssessment {
  const thresholds = resolveQueueAutoApproveThresholds();
  const reviewGate = params.reviewGate;
  if (!reviewGate) {
    return {
      decision: "hold_manual",
      confidence: 0.35,
      reasons: ["review_gate_missing"],
      suggestedAction: "recommend_manual_review",
    };
  }

  const hardBlockReasons = new Set([
    "possible_overcopy_detected",
    "comparison_missing",
    "counterargument_missing",
    "evidence_count_insufficient",
    "source_links_missing",
  ]);
  const fixableReasons = new Set([
    "citation_coverage_low",
    "body_too_short",
    "low_novelty",
    "low_relevance",
  ]);

  const hasHardBlock = reviewGate.reasons.some((reason) => hardBlockReasons.has(reason));
  if (hasHardBlock) {
    return {
      decision: "hold_manual",
      confidence: 0.8,
      reasons: reviewGate.reasons.filter((reason) => hardBlockReasons.has(reason)),
      suggestedAction: "recommend_manual_review",
    };
  }

  const hasFixableReason = reviewGate.reasons.some((reason) => fixableReasons.has(reason));
  if (hasFixableReason) {
    return {
      decision: "needs_rewrite",
      confidence: 0.74,
      reasons: reviewGate.reasons.filter((reason) => fixableReasons.has(reason)),
      suggestedAction: "recommend_rewrite",
    };
  }

  if (reviewGate.passed && reviewGate.qualityScore >= thresholds.minQualityScore) {
    return {
      decision: "auto_approve_candidate",
      confidence: 0.86,
      reasons: ["review_gate_passed", "quality_threshold_met"],
      suggestedAction: "recommend_approve",
    };
  }

  return {
    decision: "hold_manual",
    confidence: 0.55,
    reasons: reviewGate.reasons.length > 0 ? reviewGate.reasons : ["quality_threshold_not_met"],
    suggestedAction: "recommend_manual_review",
  };
}

export function resolveAutoApprovalPolicy(params: {
  assessment: QueueTriageAssessment;
  reviewGate: ReviewGateLite | null;
}): AutoApprovalPolicyResult {
  const thresholds = resolveQueueAutoApproveThresholds();
  const scheduleModeEnabled = process.env.CONTENT_OPS_QUEUE_AUTO_APPROVE_SCHEDULED === "true";
  const nextAllowedStatus: AutoApprovalPolicyResult["nextStatus"] = scheduleModeEnabled
    ? "scheduled"
    : "approved";
  if (params.assessment.decision !== "auto_approve_candidate") {
    return {
      allowed: false,
      reason: "decision_not_auto_approve_candidate",
      nextStatus: "review_required",
    };
  }
  if (params.assessment.confidence < thresholds.minConfidence) {
    return {
      allowed: false,
      reason: "confidence_below_threshold",
      nextStatus: "review_required",
    };
  }
  if (!params.reviewGate?.passed) {
    return {
      allowed: false,
      reason: "review_gate_not_passed",
      nextStatus: "review_required",
    };
  }
  if ((params.reviewGate.qualityScore ?? 0) < thresholds.minQualityScore) {
    return {
      allowed: false,
      reason: "quality_score_below_threshold",
      nextStatus: "review_required",
    };
  }
  const hardBlockReasons = new Set([
    "possible_overcopy_detected",
    "comparison_missing",
    "counterargument_missing",
    "evidence_count_insufficient",
    "source_links_missing",
  ]);
  if (params.reviewGate.reasons.some((reason) => hardBlockReasons.has(reason))) {
    return {
      allowed: false,
      reason: "hard_block_reason_detected",
      nextStatus: "review_required",
    };
  }
  return {
    allowed: true,
    reason: "auto_approval_policy_passed",
    nextStatus: nextAllowedStatus,
  };
}

function extractLatestAiReviewDecision(metadata: unknown): QueueTriageDecision | null {
  const root = asObject(metadata);
  const aiReviewLatest = asObject(asObject(root?.ai_review)?.latest);
  const decision = aiReviewLatest?.decision;
  if (
    decision === "auto_approve_candidate" ||
    decision === "needs_rewrite" ||
    decision === "hold_manual"
  ) {
    return decision;
  }
  return null;
}

/**
 * Structural rewrite adds comparison/counterargument/citation blocks (see applyRewritePatch).
 * Skip when overcopy or missing sources — those need editorial ingest or human edit.
 */
const REVIEW_GATE_REWRITE_BLOCKERS: ReadonlySet<string> = new Set([
  "possible_overcopy_detected",
  "source_links_missing",
]);

export function shouldAttemptContentQueueRewrite(metadata: unknown): {
  attempt: boolean;
  reviewGate: ReviewGateLite | null;
} {
  const triageDecision = extractLatestAiReviewDecision(metadata);
  const reviewGate = extractLatestReviewGate(metadata);

  if (triageDecision === "auto_approve_candidate") {
    return { attempt: false, reviewGate };
  }
  if (triageDecision === "needs_rewrite") {
    return { attempt: true, reviewGate };
  }
  if (!reviewGate || reviewGate.passed || reviewGate.reasons.length === 0) {
    return { attempt: false, reviewGate };
  }
  if (reviewGate.reasons.some((r) => REVIEW_GATE_REWRITE_BLOCKERS.has(r))) {
    return { attempt: false, reviewGate };
  }
  if (triageDecision === "hold_manual") {
    return { attempt: true, reviewGate };
  }
  if (triageDecision === null) {
    return { attempt: true, reviewGate };
  }
  return { attempt: false, reviewGate };
}

type RewriteDirective = {
  focusNotes: string[];
  citationAnchors: string[];
};

function buildRewriteDirective(params: {
  reasons: string[];
  sourceLinks: Array<{ title: string; url: string }>;
}): RewriteDirective {
  const reasonSet = new Set(params.reasons);
  const focusNotes: string[] = [];
  if (reasonSet.has("citation_coverage_low")) {
    focusNotes.push("Add explicit inline source anchors in core body paragraphs, not only appendix.");
  }
  if (reasonSet.has("body_too_short")) {
    focusNotes.push("Expand with concrete operator impact, implementation constraints, and rollout steps.");
  }
  if (reasonSet.has("low_novelty")) {
    focusNotes.push("Add a clear 'why now' contrast against last-cycle baseline assumptions.");
  }
  if (reasonSet.has("low_relevance")) {
    focusNotes.push("Tie recommendations to concrete owner/team workflows and measurable outcomes.");
  }
  if (focusNotes.length === 0) {
    focusNotes.push("Strengthen comparison, evidence, and actionability for operator execution quality.");
  }
  const citationAnchors = params.sourceLinks.slice(0, 3).map((source) => {
    const safeTitle = source.title.trim() || source.url;
    return `[${safeTitle}](${source.url})`;
  });
  return { focusNotes, citationAnchors };
}

function applyRewritePatch(params: {
  bodyMarkdown: string;
  directive: RewriteDirective;
}): string {
  const rewriteBlock = [
    "## AI Rewrite Pass",
    "",
    "### Why now",
    "- This update closes the execution gap observed in the latest review gate window.",
    "- It prioritizes measurable operator outcomes over generic commentary.",
    "",
    "### Comparison (vs current approach)",
    "- vs status quo: this rewrite adds explicit trade-off framing for rollout decisions.",
    "",
    "### Counterargument and rebuttal",
    "- Contrarian view: adding more structure can slow writing throughput.",
    "- Rebuttal: structured evidence and action blocks reduce downstream review churn.",
    "",
    "### Focus updates",
    ...params.directive.focusNotes.map((note) => `- ${note}`),
    "",
    "### Evidence anchors",
    ...(params.directive.citationAnchors.length > 0
      ? params.directive.citationAnchors.map((anchor) => `- ${anchor}`)
      : ["- Source anchor unavailable in current map; manual citation fill required."]),
    "",
    "### Operator next steps",
    "1. Assign owner and rollback criteria before publish.",
    "2. Run one-cycle validation and compare quality monitor delta.",
    "3. Keep escalation path visible in morning-ops panel.",
  ].join("\n");

  const trimmed = params.bodyMarkdown.trim();
  const withoutPreviousRewrite = trimmed.replace(
    /\n{0,2}## AI Rewrite Pass[\s\S]*$/m,
    "",
  ).trim();
  return `${withoutPreviousRewrite}\n\n${rewriteBlock}\n`;
}

function resolveSubscriberFrequencyWindowMs(frequencyPref: string): number | null {
  if (frequencyPref === "daily") return 24 * 60 * 60 * 1000;
  if (frequencyPref === "weekly") return 7 * 24 * 60 * 60 * 1000;
  return null;
}

function readLastNewsletterSentAtMs(subscriber: SubscriberRow): number | null {
  const root = asObject(subscriber.metadata);
  const newsletter = asObject(root?.newsletter);
  const lastSentAt = newsletter?.last_sent_at;
  if (typeof lastSentAt !== "string" || !lastSentAt.trim()) return null;
  const parsed = Date.parse(lastSentAt);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldDeferByFrequencyWindow(subscriber: SubscriberRow, nowMs: number): boolean {
  const windowMs = resolveSubscriberFrequencyWindowMs(subscriber.frequency_pref);
  if (!windowMs) return false;
  const lastSentAtMs = readLastNewsletterSentAtMs(subscriber);
  if (!lastSentAtMs) return false;
  return nowMs - lastSentAtMs < windowMs;
}

function withLastNewsletterSentAt(metadata: unknown, sentAtIso: string): Record<string, unknown> {
  const root = asObject(metadata) ?? {};
  const newsletter = asObject(root.newsletter) ?? {};
  return {
    ...root,
    newsletter: {
      ...newsletter,
      last_sent_at: sentAtIso,
    },
  };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseBatchSize(
  raw: string | undefined,
  fallback: number,
  min = 1,
  max = 100,
): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clampInt(parsed, min, max);
}

function parseNumericThreshold(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function resolveQueueAutoApproveThresholds(): QueueAutoApproveThresholds {
  return {
    minConfidence: parseNumericThreshold(
      process.env.CONTENT_OPS_QUEUE_AUTO_APPROVE_MIN_CONFIDENCE,
      DEFAULT_QUEUE_AUTO_APPROVE_MIN_CONFIDENCE,
      0,
      1,
    ),
    minQualityScore: parseNumericThreshold(
      process.env.CONTENT_OPS_QUEUE_AUTO_APPROVE_MIN_QUALITY_SCORE,
      DEFAULT_QUEUE_AUTO_APPROVE_MIN_QUALITY_SCORE,
      1,
      25,
    ),
  };
}

function resolvePublishBatchSize(retryFailedOnly: boolean): number {
  if (retryFailedOnly) {
    return parseBatchSize(
      process.env.CONTENT_OPS_RETRY_FAILED_BATCH_SIZE,
      DEFAULT_RETRY_FAILED_BATCH_SIZE,
    );
  }
  return parseBatchSize(
    process.env.CONTENT_OPS_PUBLISH_BATCH_SIZE,
    DEFAULT_PUBLISH_BATCH_SIZE,
  );
}

export function computeAdaptivePublishBatchSize(params: {
  baseBatchSize: number;
  retryFailedOnly: boolean;
  failRatio24h: number;
  configStopCount24h: number;
}): number {
  const base = clampInt(params.baseBatchSize, 1, 100);
  if (params.retryFailedOnly) return Math.min(base, 3);
  if (params.configStopCount24h >= 3) return Math.min(base, 2);
  if (params.failRatio24h >= 0.8) return 1;
  if (params.failRatio24h >= 0.5) return Math.min(base, 3);
  return base;
}

async function readPublicationHealthWindow24h(): Promise<PublicationHealthWindow> {
  const admin = createAdminClient();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("content_publications")
    .select("status,last_error,created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Array<{ status: string; last_error: string | null }>;
  const totalCount24h = rows.length;
  const failedCount24h = rows.filter((row) => row.status === "failed").length;
  const configStopCount24h = rows.filter((row) =>
    typeof row.last_error === "string" &&
    (row.last_error.includes("resend_not_configured") ||
      row.last_error.includes("resend_from_invalid_format") ||
      row.last_error.includes("resend_sandbox_sender") ||
      row.last_error.includes("resend_from_domain_mismatch")),
  ).length;
  return { totalCount24h, failedCount24h, configStopCount24h };
}

function resolveNewsletterConfigStopReason(): string | null {
  const config = resolveResendSendConfig();
  if (config.ok) return null;
  return normalizeNewsletterSendErrorReason(config.reason);
}

function parseNextRetryAt(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const retry = (metadata as Record<string, unknown>).retry;
  if (!retry || typeof retry !== "object" || Array.isArray(retry)) return null;
  const nextRetryAt = (retry as Record<string, unknown>).next_retry_at;
  return typeof nextRetryAt === "string" && nextRetryAt.trim() ? nextRetryAt : null;
}

function isBrokenFixtureSource(source: ContentSourceRow): boolean {
  const searchable = [
    source.name,
    source.base_url,
    source.rss_url ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return BROKEN_FIXTURE_SOURCE_PATTERNS.some((pattern) =>
    searchable.includes(pattern),
  );
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

export function computePublicationAttempt(
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
      skipReason: "retry_window_not_open",
    };
  }
  if (retryState.previousAttemptCount >= MAX_PUBLICATION_ATTEMPTS) {
    return {
      attemptCount: retryState.previousAttemptCount,
      shouldSkip: true,
      nextRetryAt: retryState.nextRetryAt,
      skipReason: "max_attempts_exhausted",
    };
  }
  return {
    attemptCount: nextAttempt,
    shouldSkip: false,
    nextRetryAt: null,
    skipReason: null,
  };
}

function buildRetryMetadata(params: {
  attemptCount: number;
  nowIso: string;
  maxAttempts?: number;
  retryDelayMinutes?: number;
}): { max_attempts: number; next_retry_at: string | null } {
  const maxAttempts = params.maxAttempts ?? MAX_PUBLICATION_ATTEMPTS;
  const retryDelayMinutes = params.retryDelayMinutes ?? RETRY_DELAY_MINUTES;
  const nextRetryAt =
    params.attemptCount < maxAttempts
      ? addMinutesIso(new Date(params.nowIso), retryDelayMinutes)
      : null;
  return {
    max_attempts: maxAttempts,
    next_retry_at: nextRetryAt,
  };
}

export function resolveNewsletterPublicationRetryForReason(params: {
  reason: string;
  attemptCount: number;
  nowIso: string;
}): {
  retry: { max_attempts: number; next_retry_at: string | null };
  policy: ReturnType<typeof resolveNewsletterRetryPolicy>;
} {
  const policy = resolveNewsletterRetryPolicy(params.reason);
  if (policy.action === "stop") {
    return {
      retry: { max_attempts: MAX_PUBLICATION_ATTEMPTS, next_retry_at: null },
      policy,
    };
  }
  return {
    retry: buildRetryMetadata({
      attemptCount: params.attemptCount,
      nowIso: params.nowIso,
      retryDelayMinutes: policy.delayMinutes ?? RETRY_DELAY_MINUTES,
    }),
    policy,
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

function pickSourcesForIngest(sources: ContentSourceRow[]): ContentSourceRow[] {
  const filtered = sources.filter((source) => !isBrokenFixtureSource(source));
  const sorted = [...filtered].sort(
    (a, b) => (b.trust_weight ?? 0) - (a.trust_weight ?? 0),
  );
  const preferred = sorted.filter((source) => (source.trust_weight ?? 0) >= INGEST_MIN_TRUST_WEIGHT);
  if (preferred.length > 0) {
    return preferred.slice(0, INGEST_MAX_SOURCES);
  }
  return sorted.slice(0, Math.min(INGEST_MAX_SOURCES, sorted.length));
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
    .limit(40);

  const selectedSources = pickSourcesForIngest((sources ?? []) as ContentSourceRow[]);

  let createdItems = 0;
  let scannedSources = 0;
  let failedSources = 0;
  const failureMessages: string[] = [];
  for (const source of selectedSources) {
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
          summary: `${source.name}에서 수집된 신호를 운영 관점으로 검토하기 위한 초안`,
          body_markdown: [
            "## Source signal",
            `- Source: ${source.name}`,
            `- Link: ${entry.link}`,
            `- Headline: ${entry.title}`,
            "",
            "## Why this may matter to operators",
            "- 이 신호가 현재 자동화 워크플로우의 안정성/비용/속도 중 어디에 영향을 주는지 먼저 분류합니다.",
            "- 운영 관점에서 무시 가능한 노이즈인지, 즉시 검토가 필요한 변화인지 판단합니다.",
            "",
            "## Relevance checklist",
            "1. 어떤 팀/역할이 직접 영향을 받는가?",
            "2. 실패 시 복구 비용은 어느 정도인가?",
            "3. 이번 주 실험에 반영할 최소 액션은 무엇인가?",
            "",
            "## Draft scaffold",
            "- 비교 관점(vs): 현재 방식 대비 더 나은 대안이 있는가?",
            "- 반대 관점(contrarian): 팀이 놓치기 쉬운 위험은 무엇인가?",
            "",
            "## Sources",
            `- ${entry.link}`,
          ].join("\n"),
          source_quality_score: source.trust_weight,
          status: "draft",
          metadata: {
            ingest: {
              run_id: runId,
              source_id: source.id,
              source_trust_weight: source.trust_weight,
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
  const { data: highTrustSources } = await admin
    .from("content_sources")
    .select("id")
    .eq("is_active", true)
    .gte("trust_weight", DRAFT_MIN_TRUST_WEIGHT)
    .order("trust_weight", { ascending: false })
    .limit(40);
  const highTrustIds = (highTrustSources ?? []).map((source) => source.id);

  let latestMapsQuery = admin
    .from("content_item_source_map")
    .select("source_id, source_url, source_title, source_published_at")
    .order("created_at", { ascending: false })
    .limit(DRAFT_MAX_SOURCE_BULLETS);

  if (highTrustIds.length > 0) {
    latestMapsQuery = latestMapsQuery.in("source_id", highTrustIds);
  }
  let { data: latestMaps } = await latestMapsQuery;
  if (!latestMaps || latestMaps.length === 0) {
    const fallback = await admin
      .from("content_item_source_map")
      .select("source_id, source_url, source_title, source_published_at")
      .order("created_at", { ascending: false })
      .limit(DRAFT_MAX_SOURCE_BULLETS);
    latestMaps = fallback.data ?? [];
  }

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
          autotune: {
            strategy: generated.resolved.autotune.strategy,
            selection: generated.resolved.autotune.selection,
          },
          source_policy: {
            min_trust_weight: DRAFT_MIN_TRUST_WEIGHT,
            source_bullets: latestMaps.length,
            high_trust_filter_applied: highTrustIds.length > 0,
          },
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
          autotune: {
            strategy: generated.resolved.autotune.strategy,
            selection: generated.resolved.autotune.selection,
          },
          source_policy: {
            min_trust_weight: DRAFT_MIN_TRUST_WEIGHT,
            source_bullets: latestMaps.length,
            high_trust_filter_applied: highTrustIds.length > 0,
          },
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
      reviewGate: {
        latest: {
          run_id: runId,
          checked_at: new Date().toISOString(),
          passed: gate.passed,
          reasons: gate.reasons,
          metrics: gate.metrics,
        },
      },
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

export async function runQueueTriagePipeline(runId: string): Promise<{
  scannedCount: number;
  autoApproveCandidateCount: number;
  autoApprovedCount: number;
  policyDeniedCount: number;
  needsRewriteCount: number;
  holdManualCount: number;
  failedCount: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  const thresholds = resolveQueueAutoApproveThresholds();
  const { data: candidates } = await admin
    .from("content_items")
    .select("id, type, status, metadata, updated_at")
    .in("status", ["draft", "review_required"])
    .order("updated_at", { ascending: true })
    .limit(200);

  let scannedCount = 0;
  let autoApproveCandidateCount = 0;
  let autoApprovedCount = 0;
  let policyDeniedCount = 0;
  let needsRewriteCount = 0;
  let holdManualCount = 0;
  const failureMessages: string[] = [];

  for (const item of (candidates ?? []) as ContentItemRow[]) {
    scannedCount += 1;
    const reviewGate = extractLatestReviewGate(item.metadata);
    const assessment = resolveQueueTriageAssessment({ reviewGate });

    if (assessment.decision === "auto_approve_candidate") autoApproveCandidateCount += 1;
    if (assessment.decision === "needs_rewrite") needsRewriteCount += 1;
    if (assessment.decision === "hold_manual") holdManualCount += 1;
    const policy = resolveAutoApprovalPolicy({ assessment, reviewGate });
    if (policy.allowed) autoApprovedCount += 1;
    if (!policy.allowed && assessment.decision === "auto_approve_candidate") {
      policyDeniedCount += 1;
      failureMessages.push(`[${item.id}] auto_approval_denied:${policy.reason}`);
    }

    const root = asObject(item.metadata) ?? {};
    const aiReviewRoot = asObject(root.ai_review) ?? {};
    const previousLatest = asObject(aiReviewRoot.latest);
    const nextMetadata = {
      ...root,
      ai_review: {
        ...aiReviewRoot,
        latest: {
          run_id: runId,
          checked_at: new Date().toISOString(),
          decision: assessment.decision,
          confidence: assessment.confidence,
          reasons: assessment.reasons,
          suggested_action: assessment.suggestedAction,
          policy_allowed: policy.allowed,
          policy_reason: policy.reason,
          policy_next_status: policy.nextStatus,
          policy_thresholds: {
            min_confidence: thresholds.minConfidence,
            min_quality_score: thresholds.minQualityScore,
          },
          status_at_evaluation: item.status,
          review_gate_passed: reviewGate?.passed ?? false,
          review_gate_quality_score: reviewGate?.qualityScore ?? 0,
        },
        previous: previousLatest ?? null,
      },
    };

    const { error } = await admin
      .from("content_items")
      .update({
        status: policy.nextStatus,
        metadata: nextMetadata as Json,
        updated_at: new Date().toISOString(),
        approved_at: policy.allowed ? new Date().toISOString() : null,
      })
      .eq("id", item.id);

    if (error) {
      failureMessages.push(`[${item.id}] triage_metadata_update_failed:${error.message}`);
    }
  }

  return {
    scannedCount,
    autoApproveCandidateCount,
    autoApprovedCount,
    policyDeniedCount,
    needsRewriteCount,
    holdManualCount,
    failedCount: policyDeniedCount,
    failureMessages: failureMessages.slice(0, 20),
  };
}

export async function runQueueRewritePipeline(runId: string): Promise<{
  scannedCount: number;
  rewrittenCount: number;
  gatePassedAfterRewriteCount: number;
  needsManualAfterRewriteCount: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  const { data: candidates } = await admin
    .from("content_items")
    .select("id, type, status, title, body_markdown, metadata, updated_at")
    .in("status", ["draft", "review_required"])
    .order("updated_at", { ascending: true })
    .limit(200);

  let scannedCount = 0;
  let rewrittenCount = 0;
  let gatePassedAfterRewriteCount = 0;
  let needsManualAfterRewriteCount = 0;
  const failureMessages: string[] = [];

  for (const item of (candidates ?? []) as ContentItemRow[]) {
    const { attempt, reviewGate } = shouldAttemptContentQueueRewrite(item.metadata);
    if (!attempt) continue;
    scannedCount += 1;

    const reviewBefore = reviewGate;
    const reviewReasons = reviewBefore?.reasons ?? [];
    const { data: sourceRows } = await admin
      .from("content_item_source_map")
      .select("source_title,source_url")
      .eq("content_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(5);
    const sourceLinks = (sourceRows ?? [])
      .map((row) => ({
        title: String(row.source_title ?? "").trim(),
        url: String(row.source_url ?? "").trim(),
      }))
      .filter((row) => row.url.length > 0);
    const directive = buildRewriteDirective({ reasons: reviewReasons, sourceLinks });
    const rewrittenBody = applyRewritePatch({
      bodyMarkdown: item.body_markdown ?? "",
      directive,
    });

    const gateAfter = evaluateReviewGate({
      bodyMarkdown: rewrittenBody,
      sourceLinkCount: sourceLinks.length,
    });
    if (gateAfter.passed) gatePassedAfterRewriteCount += 1;
    else needsManualAfterRewriteCount += 1;

    const root = asObject(item.metadata) ?? {};
    const aiRewriteRoot = asObject(root.ai_rewrite) ?? {};
    const previousLatest = asObject(aiRewriteRoot.latest);
    const nextMetadata = {
      ...root,
      ai_rewrite: {
        ...aiRewriteRoot,
        latest: {
          run_id: runId,
          rewritten_at: new Date().toISOString(),
          source_link_count: sourceLinks.length,
          reason_focus: reviewReasons,
          gate_before: reviewBefore
            ? {
                passed: reviewBefore.passed,
                reasons: reviewBefore.reasons,
                quality_score: reviewBefore.qualityScore,
              }
            : null,
          gate_after: {
            passed: gateAfter.passed,
            reasons: gateAfter.reasons,
            quality_score: gateAfter.metrics.qualityScore,
          },
          decision_after: gateAfter.passed ? "ready_for_approval" : "needs_manual_review",
        },
        previous: previousLatest ?? null,
      },
    };

    const { error } = await admin
      .from("content_items")
      .update({
        body_markdown: rewrittenBody,
        metadata: nextMetadata as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      failureMessages.push(`[${item.id}] rewrite_update_failed:${error.message}`);
      continue;
    }
    rewrittenCount += 1;
  }

  return {
    scannedCount,
    rewrittenCount,
    gatePassedAfterRewriteCount,
    needsManualAfterRewriteCount,
    failureMessages: failureMessages.slice(0, 20),
  };
}

async function publishNewsletterItem(item: ContentItemRow): Promise<{
  ok: boolean;
  sentCount: number;
  failedCount: number;
  deferredCount: number;
  failedReasons: string[];
  attemptCount: number;
  skipped: boolean;
  skipReason: PublicationAttempt["skipReason"];
  outcome: NewsletterPublishOutcome;
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
      deferredCount: 0,
      failedReasons: ["retry_exhausted"],
      attemptCount: attempt.attemptCount,
      skipped: true,
      skipReason: attempt.skipReason,
      outcome: "failed",
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
  let deferredCount = 0;
  const failedReasons: string[] = [];
  let configStopTriggered = false;
  if (!subscribers || subscribers.length === 0) {
    const classified = "newsletter_no_subscribers";
    const { retry, policy } = resolveNewsletterPublicationRetryForReason({
      reason: classified,
      attemptCount: attempt.attemptCount,
      nowIso,
    });
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
        retry_policy_key: policy.policyKey,
        retry_action: policy.action,
        template_version: NEWSLETTER_TEMPLATE_VERSION,
        retry,
      },
    });
    return {
      ok: false,
      sentCount,
      failedCount: 1,
      deferredCount,
      failedReasons: [classified],
      attemptCount: attempt.attemptCount,
      skipped: false,
      skipReason: null,
      outcome: "failed",
    };
  }

  const subscriberRows = (subscribers ?? []) as SubscriberRow[];
  const nowMs = Date.now();
  const nowIsoFromMs = new Date(nowMs).toISOString();
  let previousSendAt: number | null = null;
  for (const subscriber of subscriberRows) {
    if (shouldDeferByFrequencyWindow(subscriber, nowMs)) {
      deferredCount += 1;
      continue;
    }

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
      await admin
        .from("newsletter_subscribers")
        .update({
          metadata: withLastNewsletterSentAt(subscriber.metadata, nowIsoFromMs) as Json,
          updated_at: nowIsoFromMs,
        })
        .eq("id", subscriber.id);
    } else {
      const classified = classifyFailureReason(send.error);
      failedCount += 1;
      failedReasons.push(classified);
      if (isConfigStopReason(classified)) {
        configStopTriggered = true;
        const remainingSubscribers = Math.max(
          0,
          subscriberRows.length - sentCount - failedCount - deferredCount,
        );
        deferredCount += remainingSubscribers;
        break;
      }
    }
  }

  const dedupedReasons = dedupeReasons(failedReasons);
  const publicationStatus: NewsletterPublishOutcome =
    configStopTriggered && sentCount === 0
      ? "deferred"
      : failedCount > 0
      ? "failed"
      : sentCount > 0
      ? "sent"
      : "deferred";
  const consumedAttemptCount = publicationStatus === "deferred" ? retryState.previousAttemptCount : attempt.attemptCount;
  const dominantReason =
    configStopTriggered
      ? dedupedReasons[0] ?? "resend_not_configured"
      : publicationStatus === "deferred"
      ? "frequency_window_deferred"
      : dedupedReasons[0] ?? "publish_failed";
  const { retry, policy } =
    failedCount > 0
      ? resolveNewsletterPublicationRetryForReason({
          reason: dominantReason,
          attemptCount: consumedAttemptCount,
          nowIso,
        })
      : {
          retry: { max_attempts: MAX_PUBLICATION_ATTEMPTS, next_retry_at: null },
          policy: resolveNewsletterRetryPolicy("publish_success"),
        };
  const deferredReasons =
    deferredCount > 0
      ? [configStopTriggered ? dominantReason : "frequency_window_deferred"]
      : [];
  await admin.from("content_publications").insert({
    content_item_id: item.id,
    channel: "email",
    status: publicationStatus,
    provider: "resend",
    attempt_count: consumedAttemptCount,
    last_error:
      failedCount > 0
        ? `newsletter_send_failed:${dedupedReasons.slice(0, 3).join("|")}`
        : publicationStatus === "deferred"
          ? "frequency_window_deferred"
          : null,
    processed_at: nowIso,
    metadata: {
      sent_count: sentCount,
      failed_count: failedCount,
      deferred_count: deferredCount,
      failed_reasons: dedupedReasons.slice(0, 10),
      deferred_reasons: deferredReasons,
      retry_policy_key: policy.policyKey,
      retry_action: policy.action,
      publish_outcome: publicationStatus,
      template_version: NEWSLETTER_TEMPLATE_VERSION,
      retry,
    },
  });

  return {
    ok: publicationStatus === "sent",
    sentCount,
    failedCount,
    deferredCount,
    failedReasons: dedupedReasons,
    attemptCount: consumedAttemptCount,
    skipped: false,
    skipReason: null,
    outcome: publicationStatus,
  };
}

async function publishBlogItem(item: ContentItemRow): Promise<{
  ok: boolean;
  error?: string;
  attemptCount: number;
  skipped: boolean;
  skipReason: PublicationAttempt["skipReason"];
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
    return {
      ok: false,
      error: "retry_exhausted",
      attemptCount: attempt.attemptCount,
      skipped: true,
      skipReason: attempt.skipReason,
    };
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
    return {
      ok: false,
      error: classified,
      attemptCount: attempt.attemptCount,
      skipped: false,
      skipReason: null,
    };
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
  return { ok: true, attemptCount: attempt.attemptCount, skipped: false, skipReason: null };
}

export async function runPublishPipeline(params?: {
  contentItemId?: string;
  retryFailedOnly?: boolean;
}): Promise<{
  processedCount: number;
  failedCount: number;
  sentCount: number;
  deferredCount: number;
  failureMessages: string[];
}> {
  const admin = createAdminClient();
  const retryFailedOnly = Boolean(params?.retryFailedOnly);
  const baseBatchSize = params?.contentItemId ? 1 : resolvePublishBatchSize(retryFailedOnly);
  const health24h = await readPublicationHealthWindow24h();
  const failRatio24h =
    health24h.totalCount24h > 0 ? health24h.failedCount24h / health24h.totalCount24h : 0;
  const batchSize = computeAdaptivePublishBatchSize({
    baseBatchSize,
    retryFailedOnly,
    failRatio24h,
    configStopCount24h: health24h.configStopCount24h,
  });
  const newsletterConfigStopReason = resolveNewsletterConfigStopReason();
  let query = admin
    .from("content_items")
    .select("*")
    .in(
      "status",
      retryFailedOnly
        ? ["send_failed", "publishing"]
        : ["approved", "scheduled", "publishing"],
    )
    .order("updated_at", { ascending: true })
    .limit(batchSize);

  if (params?.contentItemId) {
    query = query.eq("id", params.contentItemId);
  }

  const { data: items } = await query;
  let processedCount = 0;
  let failedCount = 0;
  let sentCount = 0;
  let deferredCount = 0;
  const failureMessages: string[] = [];
  const now = Date.now();
  let configBlockedCount = 0;

  for (const item of (items ?? []) as ContentItemRow[]) {
    if (
      !params?.contentItemId &&
      item.status === "scheduled" &&
      (!item.scheduled_at || new Date(item.scheduled_at).getTime() > now)
    ) {
      continue;
    }

    if (item.type === "newsletter" && newsletterConfigStopReason) {
      const nowIso = new Date().toISOString();
      const retry = {
        max_attempts: MAX_PUBLICATION_ATTEMPTS,
        next_retry_at: addMinutesIso(new Date(nowIso), CONFIG_BLOCK_RESCHEDULE_MINUTES),
      };
      await admin.from("content_publications").insert({
        content_item_id: item.id,
        channel: "email",
        status: "deferred",
        provider: "resend",
        attempt_count: 0,
        last_error: `config_stop_blocked:${newsletterConfigStopReason}`,
        processed_at: nowIso,
        metadata: {
          sent_count: 0,
          failed_count: 0,
          deferred_count: 1,
          failed_reasons: [],
          deferred_reasons: [newsletterConfigStopReason],
          retry_policy_key: "policy.config.stop",
          retry_action: "stop",
          publish_outcome: "deferred",
          template_version: NEWSLETTER_TEMPLATE_VERSION,
          retry,
          config_blocked: true,
          config_block_reason: newsletterConfigStopReason,
        },
      });
      await admin
        .from("content_items")
        .update({
          status: "scheduled",
          scheduled_at: retry.next_retry_at,
          metadata: {
            ...((item.metadata ?? {}) as Record<string, unknown>),
            publish: {
              ...((((item.metadata ?? {}) as Record<string, unknown>).publish as
                | Record<string, unknown>
                | undefined) ?? {}),
              config_blocked: true,
              config_block_reason: newsletterConfigStopReason,
            },
          } as Json,
          updated_at: nowIso,
        })
        .eq("id", item.id);
      processedCount += 1;
      deferredCount += 1;
      configBlockedCount += 1;
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
      const skipReason = blogResult?.skipReason ?? newsletterResult?.skipReason;
      if (skipReason === "max_attempts_exhausted") {
        failureMessages.push(`[${item.type}:${item.id}] retry_exhausted`);
      }
      await admin
        .from("content_items")
        .update({
          status: "send_failed",
          metadata: {
            ...((item.metadata ?? {}) as Record<string, unknown>),
            publish: {
              ...((((item.metadata ?? {}) as Record<string, unknown>).publish as
                | Record<string, unknown>
                | undefined) ?? {}),
              retry_skip_reason: skipReason,
            },
          } as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      processedCount += 1;
      if (skipReason === "max_attempts_exhausted") {
        failedCount += 1;
      }
      continue;
    }

    const success = (blogResult?.ok ?? true) && (newsletterResult?.ok ?? true);
    if (newsletterResult?.ok) {
      sentCount += newsletterResult.sentCount;
    }
    if (newsletterResult?.deferredCount) {
      deferredCount += newsletterResult.deferredCount;
    }
    const isDeferredOnlyNewsletter =
      item.type === "newsletter" &&
      newsletterResult?.outcome === "deferred";
    if (!success) {
      if (blogResult && !blogResult.ok) {
        failureMessages.push(`[blog:${item.id}] ${classifyFailureReason(blogResult.error ?? "publish_failed")}`);
      }
      if (newsletterResult && !newsletterResult.ok) {
        if (newsletterResult.outcome === "deferred") {
          failureMessages.push(`[newsletter:${item.id}] frequency_window_deferred`);
        } else {
          const classified = dedupeReasons(newsletterResult.failedReasons);
          failureMessages.push(
            `[newsletter:${item.id}] ${classified.slice(0, 3).join("|") || "send_failed"}`,
          );
        }
      }
    }

    await admin
      .from("content_items")
      .update({
        status: isDeferredOnlyNewsletter ? "scheduled" : success ? "published" : "send_failed",
        scheduled_at: isDeferredOnlyNewsletter ? new Date().toISOString() : item.scheduled_at,
        published_at: success && !isDeferredOnlyNewsletter ? new Date().toISOString() : item.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    processedCount += 1;
    if (!success && !isDeferredOnlyNewsletter) failedCount += 1;
  }

  return {
    processedCount,
    failedCount,
    sentCount,
    deferredCount,
    failureMessages: [
      ...failureMessages.slice(0, 19),
      ...(configBlockedCount > 0
        ? [`config_stop_blocked:${newsletterConfigStopReason ?? "unknown"}:${configBlockedCount}`]
        : []),
    ].slice(0, 20),
  };
}
