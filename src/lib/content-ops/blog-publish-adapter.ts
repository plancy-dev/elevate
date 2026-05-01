import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  BLOG_TEMPLATE_VERSION,
  resolveLocaleTemplateConfig,
} from "@/lib/content-ops/locale-template-config";

const BLOG_ROOT = path.join(process.cwd(), "content/blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type LocaleTemplate = {
  introTitle: string;
  introBody: string;
  ctaTitle: string;
  ctaBody: string;
};

function resolveLocaleTemplate(locale: string): LocaleTemplate {
  const config = resolveLocaleTemplateConfig(locale);
  return {
    introTitle: config.blogIntroTitle,
    introBody: config.blogIntroBody,
    ctaTitle: config.blogCtaTitle,
    ctaBody: config.blogCtaBody,
  };
}

function applyLocaleTemplate(locale: string, bodyMarkdown: string): string {
  const template = resolveLocaleTemplate(locale);
  const trimmedBody = bodyMarkdown.trim() || "Draft content.";
  const hasCta =
    trimmedBody.includes("## Next step") ||
    trimmedBody.includes("## 다음 단계") ||
    trimmedBody.includes("## 次のアクション") ||
    trimmedBody.includes("## 下一步");
  const ctaBlock = hasCta
    ? ""
    : `\n\n## ${template.ctaTitle}\n\n${template.ctaBody}`;
  return `## ${template.introTitle}\n\n${template.introBody}\n\n${trimmedBody}${ctaBlock}`;
}

function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 80) : "untitled";
}

export async function publishContentItemToBlog(params: {
  locale: string;
  slug?: string | null;
  title: string;
  summary?: string | null;
  bodyMarkdown: string;
}): Promise<{ ok: true; slug: string; filePath: string } | { ok: false; error: string }> {
  try {
    const locale = params.locale?.trim() || "en";
    const computedSlug = params.slug?.trim() || slugify(params.title);
    if (!SLUG_RE.test(computedSlug)) {
      return { ok: false, error: "invalid_slug" };
    }

    const dirPath = path.join(BLOG_ROOT, locale);
    await fs.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, `${computedSlug}.mdx`);

    const body = applyLocaleTemplate(locale, params.bodyMarkdown);
    const frontmatter = matter.stringify(
      body,
      {
        title: params.title.trim() || "Untitled",
        description: params.summary?.trim() || "",
        date: new Date().toISOString().slice(0, 10),
        access_tier: "public",
        template_version: BLOG_TEMPLATE_VERSION,
      },
    );

    await fs.writeFile(filePath, frontmatter, "utf8");
    return { ok: true, slug: computedSlug, filePath };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
