const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

type ResendConfigErrorReason =
  | "resend_not_configured"
  | "resend_from_invalid_format"
  | "resend_sandbox_sender"
  | "resend_from_domain_mismatch";

export type ResendSendConfig =
  | { ok: true; apiKey: string; from: string; fromDomain: string }
  | { ok: false; reason: ResendConfigErrorReason };

function normalizeDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/^\./, "");
}

function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  const domain = normalizeDomain(email.slice(at + 1));
  return domain;
}

function domainMatches(fromDomain: string, verifiedDomain: string): boolean {
  return (
    fromDomain === verifiedDomain || fromDomain.endsWith(`.${verifiedDomain}`)
  );
}

export function resolveResendSendConfig(): ResendSendConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return { ok: false, reason: "resend_not_configured" };
  if (!EMAIL_RE.test(from)) {
    return { ok: false, reason: "resend_from_invalid_format" };
  }

  const fromDomain = extractDomain(from);
  if (!fromDomain) {
    return { ok: false, reason: "resend_from_invalid_format" };
  }

  const allowSandboxFrom =
    process.env.RESEND_ALLOW_SANDBOX_FROM === "1" ||
    process.env.RESEND_ALLOW_SANDBOX_FROM === "true";
  if (!allowSandboxFrom && fromDomain.endsWith("resend.dev")) {
    return { ok: false, reason: "resend_sandbox_sender" };
  }

  const verifiedDomain = normalizeDomain(process.env.RESEND_VERIFIED_DOMAIN);
  if (verifiedDomain && !domainMatches(fromDomain, verifiedDomain)) {
    return { ok: false, reason: "resend_from_domain_mismatch" };
  }

  return { ok: true, apiKey, from, fromDomain };
}
