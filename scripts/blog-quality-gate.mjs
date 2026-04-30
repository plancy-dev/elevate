#!/usr/bin/env node

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";

const cwd = process.cwd();
const statusPath = path.resolve(
  cwd,
  process.env.BLOG_QUALITY_GATE_STATUS_PATH || "artifacts/blog-quality-gate.json"
);

const HARD_REQUIRED_KEYS = ["title", "description", "date", "slug", "tags", "access_tier", "locale"];
const ACCESS_TIERS = new Set(["public", "member", "premium"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SOFT_AI_PHRASES_EN = [
  "in today's fast-paced world",
  "game changer",
  "unprecedented",
  "it is important to note that",
  "delve into"
];

const SOFT_AI_PHRASES_KO = ["빠르게 변화하는 시대", "게임 체인저", "시너지 효과", "혁신적인"];

function parseGitStatusPaths() {
  const raw = execSync("git status --porcelain", {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  });
  return raw
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const rawPath = line.slice(3).trim();
      if (rawPath.includes(" -> ")) {
        return rawPath.split(" -> ").at(-1);
      }
      return rawPath;
    });
}

function findCandidateBlogFiles(paths) {
  return paths.filter((p) => /^content\/blog\/(en|ko)\/[^/]+\.mdx$/.test(p));
}

function pushError(errors, file, message) {
  errors.push({ file, message });
}

function pushWarning(warnings, file, message) {
  warnings.push({ file, message });
}

async function writeStatus(payload) {
  await fs.mkdir(path.dirname(statusPath), { recursive: true });
  await fs.writeFile(statusPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[blog-quality-gate] Status artifact: ${path.relative(cwd, statusPath)}`);
  console.log(`[blog-quality-gate][status] ${JSON.stringify(payload)}`);
}

function validateMarkdownLinks(content, file, errors) {
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of content.matchAll(linkRe)) {
    const href = match[1].trim();
    if (!href) {
      pushError(errors, file, "Empty markdown link href detected.");
      continue;
    }
    if (href.startsWith("/") && href.includes(" ")) {
      pushError(errors, file, `Internal link contains spaces: ${href}`);
    }
  }
}

async function run() {
  const changedPaths = parseGitStatusPaths();
  const candidates = findCandidateBlogFiles(changedPaths);

  if (candidates.length === 0) {
    await writeStatus({
      status: "skipped",
      reason: "No changed EN/KO blog MDX files found",
      checked_files: []
    });
    return;
  }

  const hardErrors = [];
  const softWarnings = [];
  const slugLocaleMeta = new Map();

  for (const relPath of candidates) {
    const absPath = path.resolve(cwd, relPath);
    const raw = await fs.readFile(absPath, "utf8");
    const parsed = matter(raw);
    const meta = parsed.data || {};
    const localeFromPath = relPath.split("/")[2];
    const slugFromPath = path.basename(relPath, ".mdx");

    for (const key of HARD_REQUIRED_KEYS) {
      if (!(key in meta)) {
        pushError(hardErrors, relPath, `Missing required frontmatter key: ${key}`);
      }
    }

    if (meta.locale && meta.locale !== localeFromPath) {
      pushError(hardErrors, relPath, `Frontmatter locale '${meta.locale}' must match path locale '${localeFromPath}'.`);
    }

    if (meta.slug && meta.slug !== slugFromPath) {
      pushError(hardErrors, relPath, `Frontmatter slug '${meta.slug}' must match filename slug '${slugFromPath}'.`);
    }

    if (meta.date && !DATE_RE.test(String(meta.date))) {
      pushError(hardErrors, relPath, `Frontmatter date must use YYYY-MM-DD: '${meta.date}'.`);
    }

    if (meta.access_tier && !ACCESS_TIERS.has(meta.access_tier)) {
      pushError(
        hardErrors,
        relPath,
        `Invalid access_tier '${meta.access_tier}'. Allowed: public|member|premium.`
      );
    }

    if (meta.tags && !Array.isArray(meta.tags)) {
      pushError(hardErrors, relPath, "Frontmatter tags must be an array.");
    }

    validateMarkdownLinks(raw, relPath, hardErrors);

    if (localeFromPath === "en" && !raw.includes("/#waitlist")) {
      pushError(hardErrors, relPath, "English post must include waitlist CTA link '/#waitlist'.");
    }
    if (localeFromPath === "ko" && !raw.includes("/ko#waitlist")) {
      pushError(hardErrors, relPath, "Korean post must include waitlist CTA link '/ko#waitlist'.");
    }

    const softPhrases = localeFromPath === "en" ? SOFT_AI_PHRASES_EN : SOFT_AI_PHRASES_KO;
    const lowered = raw.toLowerCase();
    for (const phrase of softPhrases) {
      const exists = localeFromPath === "en" ? lowered.includes(phrase) : raw.includes(phrase);
      if (exists) {
        pushWarning(
          softWarnings,
          relPath,
          `Potential boilerplate phrase detected: '${phrase}' (soft warning).`
        );
      }
    }

    if (!slugLocaleMeta.has(slugFromPath)) slugLocaleMeta.set(slugFromPath, {});
    slugLocaleMeta.get(slugFromPath)[localeFromPath] = meta;
  }

  for (const [slug, localeMeta] of slugLocaleMeta.entries()) {
    const enPath = path.resolve(cwd, `content/blog/en/${slug}.mdx`);
    const koPath = path.resolve(cwd, `content/blog/ko/${slug}.mdx`);
    if (!existsSync(enPath) || !existsSync(koPath)) {
      pushError(
        hardErrors,
        slug,
        "Both EN and KO files must exist for generated slug (content/blog/en + content/blog/ko)."
      );
      continue;
    }
    if (localeMeta.en?.date && localeMeta.ko?.date && localeMeta.en.date !== localeMeta.ko.date) {
      pushError(hardErrors, slug, "EN/KO date mismatch for same slug.");
    }
  }

  const payload = {
    status: hardErrors.length > 0 ? "failed" : softWarnings.length > 0 ? "passed_with_warnings" : "passed",
    checked_files: candidates,
    hard_errors: hardErrors,
    soft_warnings: softWarnings
  };
  await writeStatus(payload);

  if (hardErrors.length > 0) {
    throw new Error("Blog quality gate failed with hard errors.");
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
