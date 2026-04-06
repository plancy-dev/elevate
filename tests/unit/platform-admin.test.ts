import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canAccessElevateServiceAdmin,
  canAccessOrganizationAdminConsole,
  getElevateServiceAdminEmails,
} from "@/lib/auth/platform-admin";

describe("platform-admin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("merges PLATFORM_ADMIN_EMAILS and ADMIN_EMAIL for Elevate service allowlist", () => {
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "a@x.com, b@x.com");
    vi.stubEnv("ADMIN_EMAIL", "seed@x.com");
    expect(getElevateServiceAdminEmails()).toEqual(
      new Set(["a@x.com", "b@x.com", "seed@x.com"]),
    );
  });

  it("Elevate service admin requires a non-empty allowlist and a listed email", () => {
    vi.stubEnv("ADMIN_EMAIL", "only@x.com");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    expect(canAccessElevateServiceAdmin("only@x.com")).toBe(true);
    expect(canAccessElevateServiceAdmin("other@x.com")).toBe(false);
  });

  it("when allowlist is empty, no Elevate service admin access", () => {
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    expect(canAccessElevateServiceAdmin("any@x.com")).toBe(false);
  });

  it("organization admin console is role === admin only", () => {
    expect(canAccessOrganizationAdminConsole("admin")).toBe(true);
    expect(canAccessOrganizationAdminConsole("organizer")).toBe(false);
    expect(canAccessOrganizationAdminConsole("viewer")).toBe(false);
  });
});
