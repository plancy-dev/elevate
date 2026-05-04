import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function readSrc(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Dashboard desk sidebar — #62 Phase 2 (a11y + analytics contract)", () => {
  it("declares PostHog sidebar nav click event (wire string stable)", () => {
    expect(PostHogEvent.ELEVATE_DASHBOARD_SIDEBAR_NAV_CLICK).toBe(
      "elevate_dashboard_sidebar_nav_click",
    );
  });

  it("TOC wires capture, aria-current, and five-locale useLocale", () => {
    const toc = readSrc("src/components/desk/TOC.tsx");
    expect(toc).toContain("PostHogEvent.ELEVATE_DASHBOARD_SIDEBAR_NAV_CLICK");
    expect(toc).toContain('aria-current={active ? "page" : undefined}');
    expect(toc).toContain('aria-current={item.href === activeHref ? "page" : undefined}');
    expect(toc).toContain("useLocale()");
    expect(toc).toContain("captureSidebarNav");
    expect(toc).toContain("href,");
    expect(toc).toContain("mode,");
    expect(toc).toContain("collapsed,");
    expect(toc).toContain("locale,");
  });
});
