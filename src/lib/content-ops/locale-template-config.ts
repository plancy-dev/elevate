export const NEWSLETTER_TEMPLATE_VERSION = "v1.1.0";
export const BLOG_TEMPLATE_VERSION = "v1.1.0";

export type LocaleTemplateConfig = {
  intro: string;
  ctaLabel: string;
  ctaHref: string;
  blogIntroTitle: string;
  blogIntroBody: string;
  blogCtaTitle: string;
  blogCtaBody: string;
};

export const LOCALE_TEMPLATE_CONFIG: Record<string, LocaleTemplateConfig> = {
  en: {
    intro: "Practical AI updates curated for workflow operators.",
    ctaLabel: "Open Elevate",
    ctaHref: "https://elevate.ai.kr/dashboard",
    blogIntroTitle: "Why this matters",
    blogIntroBody:
      "This post is generated in the Elevate editorial pipeline and reviewed before publishing.",
    blogCtaTitle: "Next step",
    blogCtaBody:
      "Subscribe to the newsletter for the daily digest and practical workflows.",
  },
  ko: {
    intro: "실무 운영자를 위해 큐레이션한 AI 업데이트입니다.",
    ctaLabel: "Elevate 열기",
    ctaHref: "https://elevate.ai.kr/dashboard",
    blogIntroTitle: "왜 중요한가",
    blogIntroBody:
      "이 글은 Elevate 에디토리얼 파이프라인에서 생성 후 검수 과정을 거쳐 발행됩니다.",
    blogCtaTitle: "다음 단계",
    blogCtaBody:
      "일간 요약과 실전 워크플로를 받으려면 뉴스레터를 구독하세요.",
  },
  ja: {
    intro: "実務オペレーター向けに厳選したAIアップデートです。",
    ctaLabel: "Elevate を開く",
    ctaHref: "https://elevate.ai.kr/dashboard",
    blogIntroTitle: "なぜ重要か",
    blogIntroBody:
      "この投稿は Elevate の編集パイプラインで生成され、レビュー後に公開されます。",
    blogCtaTitle: "次のアクション",
    blogCtaBody:
      "日次ダイジェストと実践ワークフローを受け取るにはニュースレターを購読してください。",
  },
  "zh-CN": {
    intro: "为工作流运营者精选的 AI 更新。",
    ctaLabel: "打开 Elevate",
    ctaHref: "https://elevate.ai.kr/dashboard",
    blogIntroTitle: "为什么重要",
    blogIntroBody:
      "这篇文章由 Elevate 编辑流程生成，并在发布前完成人工审核。",
    blogCtaTitle: "下一步",
    blogCtaBody: "订阅新闻通讯，获取每日摘要和可落地的工作流建议。",
  },
  "zh-TW": {
    intro: "為工作流程營運者精選的 AI 更新。",
    ctaLabel: "開啟 Elevate",
    ctaHref: "https://elevate.ai.kr/dashboard",
    blogIntroTitle: "為什麼重要",
    blogIntroBody:
      "這篇文章由 Elevate 編輯流程生成，並在發佈前完成人工審核。",
    blogCtaTitle: "下一步",
    blogCtaBody: "訂閱電子報，取得每日摘要與可落地的工作流程建議。",
  },
};

export function resolveLocaleTemplateConfig(locale?: string | null): LocaleTemplateConfig {
  if (!locale) return LOCALE_TEMPLATE_CONFIG.en;
  return LOCALE_TEMPLATE_CONFIG[locale] ?? LOCALE_TEMPLATE_CONFIG.en;
}
