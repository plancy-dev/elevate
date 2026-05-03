import { describe, expect, it } from "vitest";
import { computeAutomationHeartbeat } from "@/lib/content-ops/automation-heartbeat";

const now = Date.parse("2026-05-03T12:00:00.000Z");

describe("computeAutomationHeartbeat", () => {
  it("marks red when no rows", () => {
    const r = computeAutomationHeartbeat([], now, { lookbackHours: 168 });
    expect(r.level).toBe("red");
    expect(r.rowCount).toBe(0);
    expect(r.hoursSinceAny).toBeNull();
  });

  it("marks green when recent any run and scheduled path exists", () => {
    const r = computeAutomationHeartbeat(
      [
        {
          trigger_type: "scheduled",
          created_at: "2026-05-03T08:00:00.000Z",
          metadata: { automation_source: "cursor" },
        },
      ],
      now,
      { lookbackHours: 168 },
    );
    expect(r.level).toBe("green");
    expect(r.hoursSinceAny).toBe(4);
    expect(r.lastScheduledRunAt).toBe("2026-05-03T08:00:00.000Z");
  });

  it("marks yellow for manual-only path", () => {
    const r = computeAutomationHeartbeat(
      [
        {
          trigger_type: "manual",
          created_at: "2026-05-03T10:00:00.000Z",
          metadata: {},
        },
      ],
      now,
      { lookbackHours: 168 },
    );
    expect(r.level).toBe("yellow");
    expect(r.manualOnlyPath).toBe(true);
    expect(r.lastScheduledRunAt).toBeNull();
  });

  it("marks red when last run older than 168h", () => {
    const r = computeAutomationHeartbeat(
      [
        {
          trigger_type: "manual",
          created_at: "2026-04-20T10:00:00.000Z",
          metadata: {},
        },
      ],
      now,
      { lookbackHours: 168 },
    );
    expect(r.level).toBe("red");
    expect(r.hoursSinceAny).toBeGreaterThan(168);
  });

  it("counts scheduledWithoutAutomationSource", () => {
    const r = computeAutomationHeartbeat(
      [
        {
          trigger_type: "scheduled",
          created_at: "2026-05-03T09:00:00.000Z",
          metadata: {},
        },
      ],
      now,
      { lookbackHours: 168 },
    );
    expect(r.scheduledWithoutAutomationSource).toBe(1);
    expect(Object.keys(r.scheduledByAutomationSource)).toHaveLength(0);
  });
});
