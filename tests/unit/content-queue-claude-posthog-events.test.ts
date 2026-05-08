import { describe, expect, it } from "vitest";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

/** PLAN-content-queue-claude-gate-ux §7 — wire names stable for dashboards. */
describe("PostHogEvent — content queue Claude chain", () => {
  it("uses snake_case names exactly as wired in ContentQueueClaudeForms", () => {
    expect(PostHogEvent.CONTENT_QUEUE_CLAUDE_CHAIN_STARTED).toBe(
      "content_queue_claude_chain_started",
    );
    expect(PostHogEvent.CONTENT_QUEUE_CLAUDE_CHAIN_COMPLETED).toBe(
      "content_queue_claude_chain_completed",
    );
    expect(PostHogEvent.CONTENT_QUEUE_CLAUDE_CHAIN_FAILED).toBe(
      "content_queue_claude_chain_failed",
    );
  });
});
