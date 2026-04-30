#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { config as loadDotenv } from "dotenv";
import * as CursorSdk from "@cursor/sdk";

const { Agent, configureRipgrepPath } = CursorSdk;

loadDotenv({ path: ".env.local" });
loadDotenv();

const cwd = process.cwd();
const topicsPath = process.env.BLOG_AUTOPUBLISH_TOPICS_PATH || "docs/blog/automation/topics.json";
const resolvedTopicsPath = path.resolve(cwd, topicsPath);
const dryRun = process.env.BLOG_AUTOPUBLISH_DRY_RUN === "true";
const enabled = process.env.BLOG_AUTOPUBLISH_ENABLED === "true";
const modelId = process.env.CURSOR_MODEL || "gpt-5.5";
const apiKey = process.env.CURSOR_API_KEY;
const statusPath = path.resolve(
  cwd,
  process.env.BLOG_AUTOPUBLISH_STATUS_PATH || "artifacts/blog-autopublish-status.json"
);

function configureRipgrep() {
  if (typeof configureRipgrepPath !== "function") return;
  try {
    const rgPath = execSync("command -v rg", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    }).trim();
    if (rgPath) configureRipgrepPath(rgPath);
  } catch {
    // Keep default SDK behavior if rg is unavailable.
  }
}

function requiredEnv(name, value) {
  if (!value || String(value).trim().length === 0) {
    throw new Error(`[blog-autopublish] Missing required environment variable: ${name}`);
  }
}

function nowDateString() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sanitizeTopic(topic) {
  return {
    slug: topic.slug,
    title_hint: topic.title_hint || topic.slug,
    target_reader: topic.target_reader || "AI product operators",
    core_claims: Array.isArray(topic.core_claims) ? topic.core_claims : [],
    references: Array.isArray(topic.references) ? topic.references : [],
    access_tier: topic.access_tier || "public",
    locale: Array.isArray(topic.locale) && topic.locale.length > 0 ? topic.locale : ["en", "ko"],
    cta_en: topic.cta_en || "[Join the waitlist ->](/#waitlist)",
    cta_ko: topic.cta_ko || "[대기명단에 참여하기 ->](/ko#waitlist)"
  };
}

async function readTopicsQueue() {
  const raw = await fs.readFile(resolvedTopicsPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.topics || !Array.isArray(parsed.topics)) {
    throw new Error(`[blog-autopublish] Invalid queue format: ${topicsPath}`);
  }
  return parsed;
}

function buildPrompt(topic) {
  const today = nowDateString();
  return [
    "You are Elevate's automated blog writer operating directly inside the repository.",
    "Create production-ready MDX posts and a distribution pack for the selected topic.",
    "",
    "Hard requirements:",
    "- Use these templates and conventions: docs/BLOG_POST_PIPELINE.md and docs/templates/*.mdx.example",
    "- Create or overwrite:",
    `  - content/blog/en/${topic.slug}.mdx`,
    `  - content/blog/ko/${topic.slug}.mdx`,
    `  - docs/blog/distribution/${topic.slug}.md`,
    "- Keep frontmatter keys: title, description, date, slug, tags, access_tier, locale",
    `- frontmatter date must be ${today}`,
    `- frontmatter slug must be ${topic.slug}`,
    `- access_tier must be ${topic.access_tier}`,
    "- Write human-sounding copy, concrete examples, and clear CTA",
    `- English CTA: ${topic.cta_en}`,
    `- Korean CTA: ${topic.cta_ko}`,
    "- Keep EN and KO semantically aligned, but do not literal-translate line by line",
    "- Use ASCII arrows in markdown links (`->`), avoid unicode arrows",
    "",
    "Topic payload:",
    JSON.stringify(topic, null, 2),
    "",
    "After writing those 3 files, update docs/blog/automation/topics.json:",
    "- Mark this topic status from pending to done",
    "- Add completed_at_utc with current UTC ISO timestamp",
    "",
    "Do not edit unrelated files."
  ].join("\n");
}

async function runAgent(prompt) {
  requiredEnv("CURSOR_API_KEY", apiKey);
  const agent = await Agent.create({
    apiKey,
    model: { id: modelId },
    local: { cwd }
  });

  const run = await agent.send(prompt);
  for await (const event of run.stream()) {
    const eventType = event && typeof event === "object" ? event.type || "event" : "event";
    if (eventType === "error") {
      throw new Error(`[blog-autopublish] SDK run emitted error event: ${JSON.stringify(event)}`);
    }
  }
}

async function assertOutputFiles(topic) {
  const requiredPaths = [
    path.resolve(cwd, `content/blog/en/${topic.slug}.mdx`),
    path.resolve(cwd, `content/blog/ko/${topic.slug}.mdx`),
    path.resolve(cwd, `docs/blog/distribution/${topic.slug}.md`),
    resolvedTopicsPath
  ];

  for (const filePath of requiredPaths) {
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`[blog-autopublish] Missing expected output file: ${path.relative(cwd, filePath)}`);
    }
  }
}

function classifyFailure(error) {
  const message = String(error?.message || error || "");
  if (message.includes("Missing required environment variable: CURSOR_API_KEY")) return "auth";
  if (message.includes("Missing required environment variable")) return "env";
  if (message.includes("Invalid queue format") || message.includes("Missing expected output file")) {
    return "content_validation";
  }
  if (
    message.includes("sqlite3") ||
    message.includes("Ripgrep path not configured") ||
    message.includes("SDK run emitted error event")
  ) {
    return "sdk_runtime";
  }
  return "unknown";
}

function nextActionForFailureType(failureType) {
  if (failureType === "auth") {
    return "Check CURSOR_API_KEY and AUTOMATION_GH_TOKEN secrets in repository settings.";
  }
  if (failureType === "env") {
    return "Check required env vars and workflow env mapping for autopublish steps.";
  }
  if (failureType === "sdk_runtime") {
    return "Check sdk runtime dependencies (sqlite3 build, ripgrep path) and retry once.";
  }
  if (failureType === "content_validation") {
    return "Review queue schema/output files and rerun after fixing topic payload.";
  }
  return "Inspect workflow logs and rerun manually with push_mode=pr.";
}

async function emitStatus(statusPayload) {
  await fs.mkdir(path.dirname(statusPath), { recursive: true });
  await fs.writeFile(statusPath, `${JSON.stringify(statusPayload, null, 2)}\n`, "utf8");
  console.log(`[blog-autopublish] Status artifact: ${path.relative(cwd, statusPath)}`);
  console.log(`[blog-autopublish][status] ${JSON.stringify(statusPayload)}`);
}

async function main() {
  configureRipgrep();
  const startedAt = new Date().toISOString();
  let topicSlug = null;
  try {
    if (!enabled && !dryRun) {
      const statusPayload = {
        status: "skipped",
        reason: "BLOG_AUTOPUBLISH_ENABLED is not true",
        started_at_utc: startedAt,
        ended_at_utc: new Date().toISOString()
      };
      await emitStatus(statusPayload);
      return;
    }

    const queue = await readTopicsQueue();
    const index = queue.topics.findIndex((t) => t.status === "pending");
    if (index < 0) {
      const statusPayload = {
        status: "skipped",
        reason: "No pending topic found",
        started_at_utc: startedAt,
        ended_at_utc: new Date().toISOString()
      };
      await emitStatus(statusPayload);
      return;
    }

    const topic = sanitizeTopic(queue.topics[index]);
    topicSlug = topic.slug;
    const prompt = buildPrompt(topic);

    if (dryRun) {
      console.log("[blog-autopublish] Dry run enabled. Prompt preview:");
      console.log(prompt);
      const statusPayload = {
        status: "dry_run",
        topic_slug: topic.slug,
        started_at_utc: startedAt,
        ended_at_utc: new Date().toISOString()
      };
      await emitStatus(statusPayload);
      return;
    }

    console.log(`[blog-autopublish] Running SDK agent for topic: ${topic.slug}`);
    await runAgent(prompt);
    await assertOutputFiles(topic);
    console.log(`[blog-autopublish] Completed topic: ${topic.slug}`);
    const statusPayload = {
      status: "success",
      topic_slug: topic.slug,
      started_at_utc: startedAt,
      ended_at_utc: new Date().toISOString()
    };
    await emitStatus(statusPayload);
  } catch (error) {
    const failureType = classifyFailure(error);
    const statusPayload = {
      status: "failed",
      topic_slug: topicSlug,
      failure_type: failureType,
      message: String(error?.message || error || "Unknown error"),
      next_action: nextActionForFailureType(failureType),
      started_at_utc: startedAt,
      ended_at_utc: new Date().toISOString()
    };
    await emitStatus(statusPayload);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
