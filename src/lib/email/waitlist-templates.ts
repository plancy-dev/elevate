import type { AppLocale } from "@/lib/email/waitlist-locale";

type WaitlistEmailContent = { subject: string; html: string };

function shell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;">
<tr><td style="padding:28px;">
${inner}
<p style="margin:20px 0 0 0;font-size:11px;line-height:1.5;color:#a1a1aa;">Elevate Inc.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const BUILDERS: Record<AppLocale, () => WaitlistEmailContent> = {
  en: () => ({
    subject: "You’re on the Prompt Studio beta waitlist — Elevate",
    html: shell(`
<p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">Elevate</p>
<h1 style="margin:12px 0 0 0;font-size:20px;font-weight:600;color:#09090b;">You’re on the list</h1>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:#3f3f46;">Thanks for joining the <strong>Prompt Studio beta</strong> waitlist. We saved your email and will invite waitlist members first when the beta opens.</p>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:#3f3f46;">You’ll get product updates and occasional picks from our blog. You can unsubscribe from those emails anytime.</p>
<p style="margin:16px 0 0 0;font-size:13px;color:#71717a;">— The Elevate team</p>
`),
  }),
  ko: () => ({
    subject: "Prompt Studio 베타 웨이트리스트에 등록되었습니다 — Elevate",
    html: shell(`
<p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">Elevate</p>
<h1 style="margin:12px 0 0 0;font-size:20px;font-weight:600;color:#09090b;">웨이트리스트에 등록되었습니다</h1>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;"><strong>Prompt Studio 베타</strong> 웨이트리스트에 참여해 주셔서 감사합니다. 이메일을 저장해 두었으며, 베타가 열릴 때 웨이트리스트에 먼저 초대를 보냅니다.</p>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">제품 소식과 블로그에서 고른 글을 가끔 보내드립니다. 메일 수신을 원하지 않으면 언제든지 수신 거부할 수 있습니다.</p>
<p style="margin:16px 0 0 0;font-size:13px;color:#71717a;">— Elevate 팀</p>
`),
  }),
  ja: () => ({
    subject: "Prompt Studio ベータのウェイトリストに登録しました — Elevate",
    html: shell(`
<p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">Elevate</p>
<h1 style="margin:12px 0 0 0;font-size:20px;font-weight:600;color:#09090b;">ウェイトリストに登録しました</h1>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;"><strong>Prompt Studio ベータ</strong>のウェイトリストにお申し込みいただきありがとうございます。メールアドレスを保存しました。ベータ開始時にはウェイトリストの方から優先的にご案内します。</p>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">製品アップデートやブログのおすすめ記事をお送りする場合があります。配信停止はいつでも可能です。</p>
<p style="margin:16px 0 0 0;font-size:13px;color:#71717a;">— Elevate チーム</p>
`),
  }),
  "zh-CN": () => ({
    subject: "您已加入 Prompt Studio 测试版候补名单 — Elevate",
    html: shell(`
<p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">Elevate</p>
<h1 style="margin:12px 0 0 0;font-size:20px;font-weight:600;color:#09090b;">您已成功加入候补名单</h1>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">感谢您加入 <strong>Prompt Studio 测试版</strong> 候补名单。我们已保存您的邮箱，测试版开放时将优先邀请候补用户。</p>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">我们可能会发送产品更新与博客精选。您可随时退订。</p>
<p style="margin:16px 0 0 0;font-size:13px;color:#71717a;">— Elevate 团队</p>
`),
  }),
  "zh-TW": () => ({
    subject: "您已加入 Prompt Studio 測試版候補名單 — Elevate",
    html: shell(`
<p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">Elevate</p>
<h1 style="margin:12px 0 0 0;font-size:20px;font-weight:600;color:#09090b;">您已成功加入候補名單</h1>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">感謝您加入 <strong>Prompt Studio 測試版</strong> 候補名單。我們已保存您的電子郵件，測試版開放時將優先邀請候補使用者。</p>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">我們可能會寄送產品更新與部落格精選。您可隨時退訂。</p>
<p style="margin:16px 0 0 0;font-size:13px;color:#71717a;">— Elevate 團隊</p>
`),
  }),
};

export function getWaitlistConfirmationEmail(
  locale: AppLocale,
): WaitlistEmailContent {
  const build = BUILDERS[locale] ?? BUILDERS.en;
  return build();
}
