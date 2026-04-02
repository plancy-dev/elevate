import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canAccessPlatformAdmin,
  getPlatformAdminEmails,
} from "@/lib/auth/platform-admin";

describe("platform-admin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("merges PLATFORM_ADMIN_EMAILS and ADMIN_EMAIL", () => {
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "a@x.com, b@x.com");
    vi.stubEnv("ADMIN_EMAIL", "seed@x.com");
    expect(getPlatformAdminEmails()).toEqual(
      new Set(["a@x.com", "b@x.com", "seed@x.com"]),
    );
  });

  it("when allowlist is non-empty, only listed emails may access (org role ignored)", () => {
    vi.stubEnv("ADMIN_EMAIL", "only@x.com");
    expect(canAccessPlatformAdmin("only@x.com", "viewer")).toBe(true);
    expect(canAccessPlatformAdmin("other@x.com", "admin")).toBe(false);
  });

  it("when allowlist is empty, organization admins may access", () => {
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    expect(canAccessPlatformAdmin("any@x.com", "admin")).toBe(true);
    expect(canAccessPlatformAdmin("any@x.com", "viewer")).toBe(false);
  });
});
