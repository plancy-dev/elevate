import { describe, expect, it } from "vitest";
import {
  classifyProxyRequest,
  hasSupabaseAuthCookies,
  shouldForceLoginRedirect,
  shouldSkipSessionByPath,
} from "@/lib/proxy/skip-session";

describe("shouldSkipSessionByPath", () => {
  it.each([
    "/robots.txt",
    "/sitemap.xml",
    "/feed.xml",
    "/llms.txt",
    "/favicon.ico",
    "/icon.png",
    "/apple-icon.png",
    "/manifest.json",
    "/manifest.webmanifest",
  ])("skips static public path %s", (path) => {
    expect(shouldSkipSessionByPath(path)).toBe(true);
  });

  it("skips .well-known probes", () => {
    expect(shouldSkipSessionByPath("/.well-known/security.txt")).toBe(true);
    expect(
      shouldSkipSessionByPath("/.well-known/apple-app-site-association"),
    ).toBe(true);
  });

  it("skips webhook and waitlist api routes", () => {
    expect(shouldSkipSessionByPath("/api/webhooks/stripe")).toBe(true);
    expect(shouldSkipSessionByPath("/api/webhooks/lemon-squeezy")).toBe(true);
    expect(shouldSkipSessionByPath("/api/waitlist")).toBe(true);
  });

  it("skips next asset prefixes", () => {
    expect(shouldSkipSessionByPath("/_next/static/chunks/main.js")).toBe(true);
    expect(shouldSkipSessionByPath("/_next/image?url=foo.png")).toBe(true);
  });

  it("skips generic static assets by extension", () => {
    expect(shouldSkipSessionByPath("/static/hero.webp")).toBe(true);
    expect(shouldSkipSessionByPath("/landing/hero.mp4")).toBe(true);
    expect(shouldSkipSessionByPath("/some.woff2")).toBe(true);
  });

  it("does NOT skip dashboard files even when they have extensions", () => {
    // Dashboard routes occasionally render as paths that look like assets
    // (e.g. `/dashboard/something.html`); we must still protect them.
    expect(shouldSkipSessionByPath("/dashboard/foo.html")).toBe(false);
  });

  it("does NOT skip api/admin/auth extensions", () => {
    // Route handlers can end in extension-like segments.
    expect(shouldSkipSessionByPath("/api/data.json")).toBe(false);
    expect(shouldSkipSessionByPath("/admin/audit.csv")).toBe(false);
    expect(shouldSkipSessionByPath("/auth/callback.html")).toBe(false);
  });

  it("does NOT skip dynamic pages", () => {
    expect(shouldSkipSessionByPath("/")).toBe(false);
    expect(shouldSkipSessionByPath("/login")).toBe(false);
    expect(shouldSkipSessionByPath("/dashboard")).toBe(false);
    expect(shouldSkipSessionByPath("/blog")).toBe(false);
    expect(shouldSkipSessionByPath("/ko/blog")).toBe(false);
    expect(shouldSkipSessionByPath("/api/studio/render")).toBe(false);
    expect(shouldSkipSessionByPath("/api/auth/callback")).toBe(false);
  });
});

describe("hasSupabaseAuthCookies", () => {
  it("is true when the base auth token cookie is present", () => {
    expect(
      hasSupabaseAuthCookies(["sb-abcdef1234-auth-token", "other-cookie"]),
    ).toBe(true);
  });

  it("is true when the chunked variants are present", () => {
    expect(
      hasSupabaseAuthCookies([
        "sb-abcdef1234-auth-token.0",
        "sb-abcdef1234-auth-token.1",
      ]),
    ).toBe(true);
  });

  it("is false when only unrelated sb-* cookies are present", () => {
    expect(
      hasSupabaseAuthCookies(["sb-provider-token", "sb-some-other-cookie"]),
    ).toBe(false);
  });

  it("is false on an empty cookie list", () => {
    expect(hasSupabaseAuthCookies([])).toBe(false);
  });

  it("is false when no sb- cookies present", () => {
    expect(
      hasSupabaseAuthCookies(["next-intl-locale", "some-analytics-id"]),
    ).toBe(false);
  });
});

describe("shouldForceLoginRedirect", () => {
  it("is true for dashboard paths", () => {
    expect(shouldForceLoginRedirect("/dashboard")).toBe(true);
    expect(shouldForceLoginRedirect("/dashboard/productions")).toBe(true);
  });

  it("is false for public / auth / admin paths", () => {
    expect(shouldForceLoginRedirect("/")).toBe(false);
    expect(shouldForceLoginRedirect("/login")).toBe(false);
    expect(shouldForceLoginRedirect("/admin")).toBe(false);
    expect(shouldForceLoginRedirect("/api/waitlist")).toBe(false);
  });
});

describe("classifyProxyRequest", () => {
  it("returns skip_static for webhook hits regardless of cookies", () => {
    expect(
      classifyProxyRequest({
        pathname: "/api/webhooks/stripe",
        cookieNames: ["sb-abc-auth-token"],
      }),
    ).toBe("skip_static");
  });

  it("returns skip_anonymous for a bot visiting the home page", () => {
    expect(
      classifyProxyRequest({
        pathname: "/",
        cookieNames: [],
      }),
    ).toBe("skip_anonymous");
  });

  it("returns skip_anonymous for an unauthenticated dashboard hit", () => {
    // Dashboard with no cookies is still "anonymous"; the proxy handles the
    // redirect before we ever reach the Supabase client.
    expect(
      classifyProxyRequest({
        pathname: "/dashboard/productions",
        cookieNames: ["some-unrelated-cookie"],
      }),
    ).toBe("skip_anonymous");
  });

  it("returns needs_session when the session cookie is present", () => {
    expect(
      classifyProxyRequest({
        pathname: "/dashboard",
        cookieNames: ["sb-xyz-auth-token.0"],
      }),
    ).toBe("needs_session");
  });
});
