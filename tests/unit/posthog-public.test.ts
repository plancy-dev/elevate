import { afterEach, describe, expect, it, vi } from "vitest";
import { POSTHOG_PUBLIC_ENV } from "@/lib/env/posthog-public-constants";
import { getPosthogPublicConfig } from "@/lib/env/posthog-public";

describe("getPosthogPublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when no key or project token", () => {
    expect(getPosthogPublicConfig()).toBeNull();
  });

  it("uses NEXT_PUBLIC_POSTHOG_KEY when set", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.KEY, "phc_from_key");
    vi.stubEnv(POSTHOG_PUBLIC_ENV.PROJECT_TOKEN, "phc_from_wizard");
    expect(getPosthogPublicConfig()).toEqual({
      apiKey: "phc_from_key",
      apiHost: "https://us.i.posthog.com",
    });
  });

  it("falls back to NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN (wizard)", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.PROJECT_TOKEN, "phc_wizard_only");
    expect(getPosthogPublicConfig()).toEqual({
      apiKey: "phc_wizard_only",
      apiHost: "https://us.i.posthog.com",
    });
  });

  it("respects NEXT_PUBLIC_POSTHOG_HOST", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.PROJECT_TOKEN, "phc_x");
    vi.stubEnv(POSTHOG_PUBLIC_ENV.HOST, "https://eu.i.posthog.com");
    expect(getPosthogPublicConfig()?.apiHost).toBe("https://eu.i.posthog.com");
  });
});
