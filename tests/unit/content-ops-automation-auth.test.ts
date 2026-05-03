import { describe, expect, it, vi } from "vitest";
import {
  checkAutomationPostBearer,
  isAutomationQueryTokenAuthorized,
  readContentOpsAutomationToken,
} from "@/lib/content-ops/automation-auth";

describe("content-ops automation-auth", () => {
  it("readContentOpsAutomationToken returns undefined for unset or blank", () => {
    vi.stubEnv("CONTENT_OPS_AUTOMATION_TOKEN", "");
    expect(readContentOpsAutomationToken()).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("readContentOpsAutomationToken trims", () => {
    vi.stubEnv("CONTENT_OPS_AUTOMATION_TOKEN", "  abc  ");
    expect(readContentOpsAutomationToken()).toBe("abc");
    vi.unstubAllEnvs();
  });

  it("checkAutomationPostBearer strict_config: missing token → not configured", () => {
    vi.stubEnv("CONTENT_OPS_AUTOMATION_TOKEN", "");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { authorization: "Bearer x" },
    });
    expect(checkAutomationPostBearer(req, "strict_config")).toEqual({
      error: "automation_token_not_configured",
      status: 500,
    });
    vi.unstubAllEnvs();
  });

  it("checkAutomationPostBearer strict_config: wrong bearer → unauthorized", () => {
    vi.stubEnv("CONTENT_OPS_AUTOMATION_TOKEN", "secret");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { authorization: "Bearer wrong" },
    });
    expect(checkAutomationPostBearer(req, "strict_config")).toEqual({
      error: "unauthorized",
      status: 401,
    });
    vi.unstubAllEnvs();
  });

  it("checkAutomationPostBearer strict_config: matching bearer → true", () => {
    vi.stubEnv("CONTENT_OPS_AUTOMATION_TOKEN", "secret");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { authorization: "Bearer secret" },
    });
    expect(checkAutomationPostBearer(req, "strict_config")).toBe(true);
    vi.unstubAllEnvs();
  });

  it("checkAutomationPostBearer missing_token_unauthorized: missing env → unauthorized", () => {
    vi.stubEnv("CONTENT_OPS_AUTOMATION_TOKEN", "");
    const req = new Request("http://localhost", { method: "POST" });
    expect(checkAutomationPostBearer(req, "missing_token_unauthorized")).toEqual({
      error: "unauthorized",
      status: 401,
    });
    vi.unstubAllEnvs();
  });

  it("isAutomationQueryTokenAuthorized", () => {
    expect(isAutomationQueryTokenAuthorized("a", undefined)).toBe(false);
    expect(isAutomationQueryTokenAuthorized("a", "b")).toBe(false);
    expect(isAutomationQueryTokenAuthorized("x", "x")).toBe(true);
  });
});
