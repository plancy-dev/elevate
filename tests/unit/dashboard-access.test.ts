import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/prompt-studio/studio-beta-allowlist", () => ({
  isEmailOnPromptStudioBetaAllowlist: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailOnPromptStudioBetaAllowlist } from "@/lib/prompt-studio/studio-beta-allowlist";
import {
  canUseDashboard,
  isDashboardAccessStrictMode,
} from "@/lib/auth/dashboard-access";

function waitlistChain(row: { id: string } | null) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: row, error: null }),
      }),
    }),
  };
}

describe("dashboard-access", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(createAdminClient).mockReset();
    vi.mocked(isEmailOnPromptStudioBetaAllowlist).mockReset();
  });

  it("isDashboardAccessStrictMode is true only when DASHBOARD_ACCESS_STRICT=true", () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    expect(isDashboardAccessStrictMode()).toBe(true);
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "false");
    expect(isDashboardAccessStrictMode()).toBe(false);
  });

  it("when strict mode off, canUseDashboard allows any signed-in user without calling service role", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "false");
    await expect(canUseDashboard("any@x.com", "viewer")).resolves.toBe(true);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("strict mode: missing email is denied", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    await expect(canUseDashboard("", "admin")).resolves.toBe(false);
    await expect(canUseDashboard(undefined, "admin")).resolves.toBe(false);
  });

  it("strict mode: Elevate service admin email is allowed without list lookup", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    vi.stubEnv("ADMIN_EMAIL", "ops@co.com");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    await expect(canUseDashboard("Ops@co.com", "viewer")).resolves.toBe(true);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("strict mode: organization admin is allowed by default", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    await expect(canUseDashboard("u@co.com", "admin")).resolves.toBe(true);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("strict mode: org admin denied when DASHBOARD_ALLOW_ORG_ADMIN=false and not on lists", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    vi.stubEnv("DASHBOARD_ALLOW_ORG_ADMIN", "false");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    vi.mocked(isEmailOnPromptStudioBetaAllowlist).mockResolvedValue(false);
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => {
        expect(table).toBe("waitlist_signups");
        return waitlistChain(null);
      },
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(canUseDashboard("u@co.com", "admin")).resolves.toBe(false);
  });

  it("strict mode: viewer allowed when email is on marketing waitlist", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    vi.mocked(isEmailOnPromptStudioBetaAllowlist).mockResolvedValue(false);
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => {
        expect(table).toBe("waitlist_signups");
        return waitlistChain({ id: "w1" });
      },
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(canUseDashboard("listed@co.com", "viewer")).resolves.toBe(true);
  });

  it("strict mode: viewer allowed when email is on studio beta allowlist", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    vi.mocked(isEmailOnPromptStudioBetaAllowlist).mockResolvedValue(true);
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => {
        expect(table).toBe("waitlist_signups");
        return waitlistChain(null);
      },
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(canUseDashboard("beta@co.com", "viewer")).resolves.toBe(true);
  });

  it("strict mode: viewer denied when not on waitlist or beta allowlist", async () => {
    vi.stubEnv("DASHBOARD_ACCESS_STRICT", "true");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    vi.mocked(isEmailOnPromptStudioBetaAllowlist).mockResolvedValue(false);
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => {
        expect(table).toBe("waitlist_signups");
        return waitlistChain(null);
      },
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(canUseDashboard("nope@co.com", "viewer")).resolves.toBe(false);
  });
});
