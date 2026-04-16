import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

import { STUDIO_CONTENT_TEXT_MAX } from "@/lib/studio-productions/constants";

import type { UrlExtractMeta, UrlExtractResult } from "./types";
import { assertUrlSafeForFetch, UrlNotAllowedError } from "./url-safety";

const MAX_HTML_BYTES = 5_000_000;
const FETCH_TIMEOUT_MS = 12_000;
/** Transient failures (cold start, rate limits, flaky networks) — not for 403/404. */
const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_DELAYS_MS = [0, 450, 1200];

const USER_AGENT =
  "Elevate-URL-Extract/1.0 (+https://elevate.ai.kr; reference pipeline)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function metaContent(
  doc: Document,
  selectors: { prop?: string; name?: string }[],
): string | null {
  for (const s of selectors) {
    const sel = s.prop
      ? `meta[property="${s.prop}"]`
      : `meta[name="${s.name}"]`;
    const el = doc.querySelector(sel);
    const c = el?.getAttribute("content")?.trim();
    if (c) return c;
  }
  return null;
}

function extractOpenGraphMeta(doc: Document): UrlExtractMeta {
  return {
    title:
      metaContent(doc, [
        { prop: "og:title" },
        { name: "twitter:title" },
      ]) ?? doc.querySelector("title")?.textContent?.trim() ?? null,
    description: metaContent(doc, [
      { prop: "og:description" },
      { name: "twitter:description" },
      { name: "description" },
    ]),
    image: metaContent(doc, [{ prop: "og:image" }, { name: "twitter:image" }]),
    siteName: metaContent(doc, [{ prop: "og:site_name" }]),
    author:
      metaContent(doc, [{ name: "author" }, { prop: "article:author" }]) ??
      null,
    publishedAt:
      metaContent(doc, [
        { prop: "article:published_time" },
        { name: "article:published_time" },
      ]) ?? null,
  };
}

function truncateForStorage(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max) + "\n\n[…truncated]", truncated: true };
}

/**
 * Builds the artifact `content_text` blob from URL extraction result.
 */
export function formatUrlExtractAsReferenceText(
  canonicalUrl: string,
  result: UrlExtractResult,
): string {
  const m = result.meta;
  const lines: string[] = [];
  lines.push(`URL: ${canonicalUrl}`);
  if (m.title) lines.push(`Title: ${m.title}`);
  if (m.siteName) lines.push(`Site: ${m.siteName}`);
  if (m.author) lines.push(`Author: ${m.author}`);
  if (m.publishedAt) lines.push(`Published: ${m.publishedAt}`);
  lines.push("");
  if (m.description) {
    lines.push("Summary / description:");
    lines.push(m.description);
    lines.push("");
  }
  lines.push("--- Page content ---");
  if (result.body?.trim()) {
    lines.push(result.body.trim());
  } else {
    lines.push(
      "(Automatic body extraction did not return text. Use the summary above or paste more text manually.)",
    );
  }
  const full = lines.join("\n");
  const { text } = truncateForStorage(full, STUDIO_CONTENT_TEXT_MAX);
  return text;
}

async function fetchHtmlBytes(canonicalUrl: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(canonicalUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`HTTP ${res.status}`);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches HTML with limited retries (helps serverless cold starts and transient network errors).
 * Does not retry SSRF/validation errors.
 */
async function fetchHtmlWithRetries(canonicalUrl: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < FETCH_MAX_ATTEMPTS; attempt++) {
    const delay = FETCH_RETRY_DELAYS_MS[attempt] ?? 600;
    if (delay > 0) await sleep(delay);
    try {
      const buf = await fetchHtmlBytes(canonicalUrl);
      const slice =
        buf.byteLength > MAX_HTML_BYTES ? buf.slice(0, MAX_HTML_BYTES) : buf;
      return new TextDecoder("utf-8", { fatal: false }).decode(slice);
    } catch (e) {
      lastError = e;
      if (e instanceof UrlNotAllowedError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      const codeMatch = /^HTTP (\d{3})/.exec(msg);
      if (codeMatch) {
        const httpStatus = Number(codeMatch[1]);
        if (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429) {
          throw e;
        }
      }
      if (attempt === FETCH_MAX_ATTEMPTS - 1) throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Fetches a public web URL and extracts metadata + main text when possible.
 */
export async function extractUrlContent(rawUrl: string): Promise<UrlExtractResult> {
  const started = Date.now();
  let canonicalUrl: string;
  try {
    const url = await assertUrlSafeForFetch(rawUrl);
    canonicalUrl = url.href;
  } catch (e) {
    if (e instanceof UrlNotAllowedError) throw e;
    throw new UrlNotAllowedError("Invalid URL.", "invalid");
  }

  const html = await fetchHtmlWithRetries(canonicalUrl);

  const domMeta = new JSDOM(html, { url: canonicalUrl });
  const meta = extractOpenGraphMeta(domMeta.window.document);

  let body: string | null = null;
  let extractMethod: UrlExtractResult["extractMethod"] = "meta_only";

  try {
    const domBody = new JSDOM(html, { url: canonicalUrl });
    const reader = new Readability(domBody.window.document);
    const article = reader.parse();
    if (article?.textContent?.trim()) {
      body = article.textContent.trim();
      extractMethod = "readability";
    }
  } catch {
    extractMethod = "failed";
  }

  let bodyTruncated = false;
  if (body && body.length > STUDIO_CONTENT_TEXT_MAX / 2) {
    const t = truncateForStorage(body, Math.floor(STUDIO_CONTENT_TEXT_MAX / 2));
    body = t.text;
    bodyTruncated = t.truncated;
  }

  return {
    url: canonicalUrl,
    meta,
    body,
    bodyTruncated,
    extractMethod,
    fetchDurationMs: Date.now() - started,
  };
}

export { UrlNotAllowedError } from "./url-safety";
