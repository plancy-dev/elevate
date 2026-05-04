import { afterEach, describe, expect, it, vi } from "vitest";
import { POSTHOG_PUBLIC_ENV } from "@/lib/env/posthog-public-constants";
import {
  getPosthogPublicConfig,
  isPosthogBrowserDebugEnabled,
} from "@/lib/env/posthog-public";

describe("getPosthogPublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when PROJECT_TOKEN is unset", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.PROJECT_TOKEN, "");
    expect(getPosthogPublicConfig()).toBeNull();
  });

  it("returns config when NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is set", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.PROJECT_TOKEN, "phc_x");
    expect(getPosthogPublicConfig()).toEqual({
      apiKey: "phc_x",
      apiHost: "https://us.i.posthog.com",
    });
  });

  it("respects NEXT_PUBLIC_POSTHOG_HOST", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.PROJECT_TOKEN, "phc_x");
    vi.stubEnv(POSTHOG_PUBLIC_ENV.HOST, "https://eu.i.posthog.com");
    expect(getPosthogPublicConfig()?.apiHost).toBe("https://eu.i.posthog.com");
  });
});

describe("isPosthogBrowserDebugEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when unset", () => {
    expect(isPosthogBrowserDebugEnabled()).toBe(false);
  });

  it("is true for 1 / true / yes (case-insensitive)", () => {
    vi.stubEnv(POSTHOG_PUBLIC_ENV.BROWSER_DEBUG, "1");
    expect(isPosthogBrowserDebugEnabled()).toBe(true);
    vi.unstubAllEnvs();
    vi.stubEnv(POSTHOG_PUBLIC_ENV.BROWSER_DEBUG, "TRUE");
    expect(isPosthogBrowserDebugEnabled()).toBe(true);
  });
});
