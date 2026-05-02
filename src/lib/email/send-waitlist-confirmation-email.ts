import { Resend } from "resend";
import { resolveWaitlistEmailLocale } from "@/lib/email/waitlist-locale";
import { resolveResendSendConfig } from "@/lib/email/resend-config";
import { getWaitlistConfirmationEmail } from "@/lib/email/waitlist-templates";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function normalizeBcc(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (!t || t.length > 254 || !EMAIL_RE.test(t)) return undefined;
  return t.toLowerCase();
}

/**
 * Sends a localized waitlist confirmation via Resend. Fails soft if env is missing.
 */
export async function sendWaitlistConfirmationEmail(params: {
  to: string;
  locale: string | null | undefined;
  bcc: string | null | undefined;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const resendConfig = resolveResendSendConfig();
  if (!resendConfig.ok) {
    console.warn(
      `[waitlist-email] Resend sender check failed (${resendConfig.reason}); skip send`,
    );
    return { ok: false, reason: resendConfig.reason };
  }

  const loc = resolveWaitlistEmailLocale(params.locale);
  const { subject, html } = getWaitlistConfirmationEmail(loc);
  const bcc = normalizeBcc(params.bcc);

  const resend = new Resend(resendConfig.apiKey);
  const { error } = await resend.emails.send({
    from: resendConfig.from,
    to: params.to.trim(),
    subject,
    html,
    ...(bcc ? { bcc: [bcc] } : {}),
  });

  if (error) {
    console.error("[waitlist-email] Resend error:", error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}
