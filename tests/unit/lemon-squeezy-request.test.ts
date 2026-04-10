import { describe, expect, it } from "vitest";
import { getLemonWebhookEventName } from "@/lib/payments/lemon-squeezy-request";

describe("getLemonWebhookEventName", () => {
  it("prefers X-Event-Name over body meta", () => {
    expect(
      getLemonWebhookEventName(
        { meta: { event_name: "order_refunded" } },
        "order_created",
      ),
    ).toBe("order_created");
  });

  it("falls back to meta.event_name when header missing", () => {
    expect(
      getLemonWebhookEventName({ meta: { event_name: "order_created" } }, null),
    ).toBe("order_created");
  });

  it("returns empty when neither is a string", () => {
    expect(getLemonWebhookEventName({}, null)).toBe("");
    expect(getLemonWebhookEventName({ meta: { event_name: 1 } }, null)).toBe("");
  });
});
