import { Resend } from "resend";
import {
  NEWSLETTER_TEMPLATE_VERSION,
  resolveLocaleTemplateConfig,
} from "@/lib/content-ops/locale-template-config";
import { resolveResendSendConfig } from "@/lib/email/resend-config";

type NewsletterLocaleTemplate = {
  preheader: string;
  heading: string;
};

export type NewsletterRetryPolicyAction = "immediate" | "delayed" | "stop";
export type NewsletterRetryPolicyKey =
  | "policy.rate_limit.delayed"
  | "policy.transient.delayed"
  | "policy.config.stop"
  | "policy.no_subscribers.stop"
  | "policy.exhausted.stop"
  | "policy.frequency_window.delayed";

export function resolveNewsletterRetryPolicy(reason: string): {
  policyKey: NewsletterRetryPolicyKey;
  action: NewsletterRetryPolicyAction;
  delayMinutes: number | null;
} {
  const normalized = reason.toLowerCase();
  if (normalized.includes("retry_exhausted")) {
    return { policyKey: "policy.exhausted.stop", action: "stop", delayMinutes: null };
  }
  if (normalized.includes("newsletter_no_subscribers")) {
    return { policyKey: "policy.no_subscribers.stop", action: "stop", delayMinutes: null };
  }
  if (normalized.includes("frequency_window_deferred")) {
    return { policyKey: "policy.frequency_window.delayed", action: "delayed", delayMinutes: 1440 };
  }
  if (
    normalized.includes("resend_not_configured") ||
    normalized.includes("resend_from_invalid_format") ||
    normalized.includes("resend_sandbox_sender") ||
    normalized.includes("resend_from_domain_mismatch")
  ) {
    return { policyKey: "policy.config.stop", action: "stop", delayMinutes: null };
  }
  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return { policyKey: "policy.rate_limit.delayed", action: "delayed", delayMinutes: 30 };
  }
  return { policyKey: "policy.transient.delayed", action: "delayed", delayMinutes: 30 };
}

const LOCALE_TEMPLATES: Record<string, NewsletterLocaleTemplate> = {
  en: {
    preheader: "Daily AI signal for operators",
    heading: "Elevate Daily Brief",
  },
  ko: {
    preheader: "운영자를 위한 일간 AI 시그널",
    heading: "Elevate 데일리 브리프",
  },
  ja: {
    preheader: "運用担当者向けの毎日AIシグナル",
    heading: "Elevate デイリーブリーフ",
  },
  "zh-CN": {
    preheader: "面向运营者的每日 AI 信号",
    heading: "Elevate 每日简报",
  },
  "zh-TW": {
    preheader: "給營運者的每日 AI 訊號",
    heading: "Elevate 每日簡報",
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
  const copy = resolveLocaleTemplateConfig(params.locale);
  const body = markdownToHtml(params.markdownBody.trim());
  return `
<div style="background:#f7f6f3;padding:24px 0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#181512">
  <div style="max-width:620px;margin:0 auto;border:1px solid #e5e2da;background:#ffffff">
    <div style="padding:18px 20px;border-bottom:1px solid #e5e2da;background:#faf9f7">
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7b7569">${t.preheader}</div>
      <h1 style="margin:10px 0 0;font-size:20px;line-height:1.35;color:#181512">${t.heading}</h1>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#5f594f">${copy.intro}</p>
    </div>
    <div style="padding:20px">
      <h2 style="margin:0 0 12px;font-size:18px;line-height:1.4;color:#181512">${params.subject.trim()}</h2>
      <div style="font-size:14px;line-height:1.7;color:#2a261f"><p>${body}</p></div>
      <div style="margin-top:22px">
        <a href="${copy.ctaHref}" style="display:inline-block;border:1px solid #d7d0c2;background:#fdf8f0;padding:10px 14px;font-size:12px;color:#181512;text-decoration:none">${copy.ctaLabel}</a>
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
}): Promise<
  | { ok: true; providerMessageId?: string; templateVersion: string }
  | { ok: false; error: string; templateVersion: string }
> {
  const resendConfig = resolveResendSendConfig();
  if (!resendConfig.ok) {
    return {
      ok: false,
      error: resendConfig.reason,
      templateVersion: NEWSLETTER_TEMPLATE_VERSION,
    };
  }

  try {
    const resend = new Resend(resendConfig.apiKey);
    const html = buildBrandedNewsletterHtml({
      locale: params.locale,
      subject: params.subject,
      markdownBody: params.markdownBody,
    });
    const result = await resend.emails.send({
      from: resendConfig.from,
      to: params.to.trim(),
      subject: params.subject.trim(),
      html,
    });

    if (result.error) {
      return {
        ok: false,
        error: result.error.message,
        templateVersion: NEWSLETTER_TEMPLATE_VERSION,
      };
    }
    return {
      ok: true,
      providerMessageId: result.data?.id,
      templateVersion: NEWSLETTER_TEMPLATE_VERSION,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
      templateVersion: NEWSLETTER_TEMPLATE_VERSION,
    };
  }
}
