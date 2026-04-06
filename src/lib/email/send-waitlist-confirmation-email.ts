import { Resend } from "resend";
import { resolveWaitlistEmailLocale } from "@/lib/email/waitlist-locale";
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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.warn(
      "[waitlist-email] RESEND_API_KEY or RESEND_FROM_EMAIL missing; skip send",
    );
    return { ok: false, reason: "not_configured" };
  }

  const loc = resolveWaitlistEmailLocale(params.locale);
  const { subject, html } = getWaitlistConfirmationEmail(loc);
  const bcc = normalizeBcc(params.bcc);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
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
