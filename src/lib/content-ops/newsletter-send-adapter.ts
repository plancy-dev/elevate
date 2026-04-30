import { Resend } from "resend";

type NewsletterLocaleTemplate = {
  preheader: string;
  heading: string;
  intro: string;
  ctaLabel: string;
};

const LOCALE_TEMPLATES: Record<string, NewsletterLocaleTemplate> = {
  en: {
    preheader: "Daily AI signal for operators",
    heading: "Elevate Daily Brief",
    intro: "Practical AI updates curated for workflow operators.",
    ctaLabel: "Open Elevate",
  },
  ko: {
    preheader: "운영자를 위한 일간 AI 시그널",
    heading: "Elevate 데일리 브리프",
    intro: "실무 운영자를 위해 큐레이션한 AI 업데이트입니다.",
    ctaLabel: "Elevate 열기",
  },
  ja: {
    preheader: "運用担当者向けの毎日AIシグナル",
    heading: "Elevate デイリーブリーフ",
    intro: "実務オペレーター向けに厳選したAIアップデートです。",
    ctaLabel: "Elevate を開く",
  },
  "zh-CN": {
    preheader: "面向运营者的每日 AI 信号",
    heading: "Elevate 每日简报",
    intro: "为工作流运营者精选的 AI 更新。",
    ctaLabel: "打开 Elevate",
  },
  "zh-TW": {
    preheader: "給營運者的每日 AI 訊號",
    heading: "Elevate 每日簡報",
    intro: "為工作流程營運者精選的 AI 更新。",
    ctaLabel: "開啟 Elevate",
  },
};

function resolveTemplate(locale?: string | null): NewsletterLocaleTemplate {
  if (!locale) return LOCALE_TEMPLATES.en;
  return LOCALE_TEMPLATES[locale] ?? LOCALE_TEMPLATES.en;
}

function markdownToHtml(input: string): string {
  const escaped = input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return escaped.replaceAll("\n\n", "</p><p>").replaceAll("\n", "<br/>");
}

function buildBrandedNewsletterHtml(params: {
  locale?: string | null;
  subject: string;
  markdownBody: string;
}): string {
  const t = resolveTemplate(params.locale);
  const body = markdownToHtml(params.markdownBody.trim());
  return `
<div style="background:#f7f6f3;padding:24px 0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#181512">
  <div style="max-width:620px;margin:0 auto;border:1px solid #e5e2da;background:#ffffff">
    <div style="padding:18px 20px;border-bottom:1px solid #e5e2da;background:#faf9f7">
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7b7569">${t.preheader}</div>
      <h1 style="margin:10px 0 0;font-size:20px;line-height:1.35;color:#181512">${t.heading}</h1>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#5f594f">${t.intro}</p>
    </div>
    <div style="padding:20px">
      <h2 style="margin:0 0 12px;font-size:18px;line-height:1.4;color:#181512">${params.subject.trim()}</h2>
      <div style="font-size:14px;line-height:1.7;color:#2a261f"><p>${body}</p></div>
      <div style="margin-top:22px">
        <a href="https://elevate.ai.kr/dashboard" style="display:inline-block;border:1px solid #d7d0c2;background:#fdf8f0;padding:10px 14px;font-size:12px;color:#181512;text-decoration:none">${t.ctaLabel}</a>
      </div>
    </div>
  </div>
</div>`.trim();
}

export async function sendNewsletterEmail(params: {
  to: string;
  subject: string;
  markdownBody: string;
  locale?: string | null;
}): Promise<{ ok: true; providerMessageId?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return { ok: false, error: "resend_not_configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const html = buildBrandedNewsletterHtml({
      locale: params.locale,
      subject: params.subject,
      markdownBody: params.markdownBody,
    });
    const result = await resend.emails.send({
      from,
      to: params.to.trim(),
      subject: params.subject.trim(),
      html,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, providerMessageId: result.data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
