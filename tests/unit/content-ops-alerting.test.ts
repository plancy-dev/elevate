import { describe, expect, it } from "vitest";
import { resolveEscalationActionLoop } from "@/lib/content-ops/alerting";

describe("content ops escalation action loop", () => {
  it("returns owner-assigned checklist for three-day regression", () => {
    const plan = resolveEscalationActionLoop({
      reason: "three_day_review_required_regression",
      runType: "review_gate",
      nextAction: "Open /admin/morning-ops and execute backlog-first action plan.",
      threeDayRegressionTriggered: true,
      configStopFailureDetected: false,
    });

    expect(plan.next_action).toContain("/admin/morning-ops");
    expect(plan.action_checklist.length).toBeGreaterThanOrEqual(3);
    expect(plan.owner_assignment.path).toBe("/admin/morning-ops");
    expect(plan.owner_assignment.field).toBe("escalation.owner");
  });

  it("returns config-stop specific owner assignment when config failure detected", () => {
    const plan = resolveEscalationActionLoop({
      reason: "newsletter_config_stop_detected",
      runType: "publish",
      nextAction: "Fix resend configuration and rerun controlled publish window.",
      threeDayRegressionTriggered: false,
      configStopFailureDetected: true,
    });

    expect(plan.action_checklist.join(" ")).toContain("RESEND_API_KEY");
    expect(plan.owner_assignment.suggested_owner).toBe("automation-reliability-oncall");
  });
});
