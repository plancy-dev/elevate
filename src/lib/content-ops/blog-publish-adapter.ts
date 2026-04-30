import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const BLOG_ROOT = path.join(process.cwd(), "content/blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type LocaleTemplate = {
  introTitle: string;
  introBody: string;
  ctaTitle: string;
  ctaBody: string;
};

const LOCALE_TEMPLATES: Record<string, LocaleTemplate> = {
  en: {
    introTitle: "Why this matters",
    introBody:
      "This post is generated in the Elevate editorial pipeline and reviewed before publishing.",
    ctaTitle: "Next step",
    ctaBody:
      "Subscribe to the newsletter for the daily digest and practical workflows.",
  },
  ko: {
    introTitle: "왜 중요한가",
    introBody:
      "이 글은 Elevate 에디토리얼 파이프라인에서 생성 후 검수 과정을 거쳐 발행됩니다.",
    ctaTitle: "다음 단계",
    ctaBody:
      "일간 요약과 실전 워크플로를 받으려면 뉴스레터를 구독하세요.",
  },
  ja: {
    introTitle: "なぜ重要か",
    introBody:
      "この投稿は Elevate の編集パイプラインで生成され、レビュー後に公開されます。",
    ctaTitle: "次のアクション",
    ctaBody:
      "日次ダイジェストと実践ワークフローを受け取るにはニュースレターを購読してください。",
  },
  "zh-CN": {
    introTitle: "为什么重要",
    introBody:
      "这篇文章由 Elevate 编辑流程生成，并在发布前完成人工审核。",
    ctaTitle: "下一步",
    ctaBody: "订阅新闻通讯，获取每日摘要和可落地的工作流建议。",
  },
  "zh-TW": {
    introTitle: "為什麼重要",
    introBody:
      "這篇文章由 Elevate 編輯流程生成，並在發佈前完成人工審核。",
    ctaTitle: "下一步",
    ctaBody: "訂閱電子報，取得每日摘要與可落地的工作流程建議。",
  },
};

function resolveLocaleTemplate(locale: string): LocaleTemplate {
  return LOCALE_TEMPLATES[locale] ?? LOCALE_TEMPLATES.en;
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
      },
    );

    await fs.writeFile(filePath, frontmatter, "utf8");
    return { ok: true, slug: computedSlug, filePath };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
