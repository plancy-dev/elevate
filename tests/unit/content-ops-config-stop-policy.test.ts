import { describe, expect, it } from "vitest";
import {
  normalizeNewsletterSendErrorReason,
  resolveNewsletterRetryPolicy,
} from "@/lib/content-ops/newsletter-send-adapter";
import {
  CONTENT_OPS_EXECUTOR_POLICY,
  CONTENT_OPS_RUNTIME,
  resolveRuntimeMismatchRule,
} from "@/lib/content-ops/automation-config";
import {
  computeAdaptivePublishBatchSize,
  resolveNewsletterPublicationRetryForReason,
} from "@/lib/content-ops/pipeline-runner";

describe("content ops config-stop policy contract", () => {
  it("normalizes raw resend configuration errors", () => {
    expect(
      normalizeNewsletterSendErrorReason("Missing Resend API key in environment"),
    ).toBe("resend_not_configured");
    expect(
      normalizeNewsletterSendErrorReason("sender domain mismatch with verified domain"),
    ).toBe("resend_from_domain_mismatch");
    expect(
      normalizeNewsletterSendErrorReason(
        "You can only send testing emails to your own email address (me@example.com).",
      ),
    ).toBe("resend_sandbox_sender");
    expect(
      normalizeNewsletterSendErrorReason(
        "Please verify a domain at resend.com/domains before sending to other recipients.",
      ),
    ).toBe("resend_from_domain_mismatch");
  });

  it("keeps known config reasons stable", () => {
    expect(
      normalizeNewsletterSendErrorReason("resend_not_configured"),
    ).toBe("resend_not_configured");
    expect(resolveNewsletterRetryPolicy("resend_not_configured").action).toBe("stop");
  });

  it("forces stop-policy reasons to have no next retry timestamp", () => {
    const stopCase = resolveNewsletterPublicationRetryForReason({
      reason: "resend_not_configured",
      attemptCount: 1,
      nowIso: "2026-05-02T00:00:00.000Z",
    });
    expect(stopCase.policy.action).toBe("stop");
    expect(stopCase.retry.next_retry_at).toBeNull();

    const delayedCase = resolveNewsletterPublicationRetryForReason({
      reason: "Too many requests. You can only make 2 requests per second.",
      attemptCount: 1,
      nowIso: "2026-05-02T00:00:00.000Z",
    });
    expect(delayedCase.policy.action).toBe("delayed");
    expect(delayedCase.retry.next_retry_at).toBeTruthy();
  });

  it("returns actionable runtime mismatch guidance", () => {
    const source = CONTENT_OPS_RUNTIME === "cursor" ? "vercel-cron" : "cursor";
    const mismatch = resolveRuntimeMismatchRule(source);
    expect(mismatch.mismatched).toBe(true);
    expect(mismatch.nextAction).toContain("CONTENT_OPS_AUTOMATION_RUNTIME");
    expect(mismatch.nextAction).toContain("CONTENT_OPS_AUTOMATION_TOKEN");
  });

  it("keeps cursor-first executor policy as default", () => {
    expect(CONTENT_OPS_EXECUTOR_POLICY.primary).toBe("cursor");
    expect(CONTENT_OPS_EXECUTOR_POLICY.fallback).toBe("vercel-cron");
  });

  it("reduces publish batch size under high fail ratio or config-stop pressure", () => {
    expect(
      computeAdaptivePublishBatchSize({
        baseBatchSize: 20,
        retryFailedOnly: false,
        failRatio24h: 0.7,
        configStopCount24h: 0,
      }),
    ).toBe(3);
    expect(
      computeAdaptivePublishBatchSize({
        baseBatchSize: 20,
        retryFailedOnly: false,
        failRatio24h: 0.1,
        configStopCount24h: 4,
      }),
    ).toBe(2);
    expect(
      computeAdaptivePublishBatchSize({
        baseBatchSize: 5,
        retryFailedOnly: true,
        failRatio24h: 0.9,
        configStopCount24h: 10,
      }),
    ).toBe(3);
  });
});
