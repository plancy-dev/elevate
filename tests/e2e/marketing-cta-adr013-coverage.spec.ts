import type { Locator, Page } from "@playwright/test";
import { test } from "@playwright/test";

/**
 * ADR-013 §5 REFLECT: exercise every MarketingCtaId surface on prod (14 wire values).
 * Run: `PLAYWRIGHT_BASE_URL=https://elevate.ai.kr pnpm exec playwright test tests/e2e/marketing-cta-adr013-coverage.spec.ts`
 * A short settle after each click gives `posthog.capture` time to send before the next navigation.
 * Spot-check PostHog Live / HogQL on `cta_id` (ClickHouse can lag ~1–2 min).
 */

async function clickAndSettle(page: Page, target: Locator, ms = 1800) {
  await target.click();
  await page.waitForTimeout(ms);
}
test.describe("marketing CTA ADR-013 prod coverage", () => {
  test.describe.configure({ mode: "serial" });

  test("fires all 14 cta_id surfaces on elevate.ai.kr", async ({ page }) => {
    test.setTimeout(180_000);
    const base = process.env.PLAYWRIGHT_BASE_URL ?? "";
    test.skip(
      !base.includes("elevate.ai.kr"),
      "Set PLAYWRIGHT_BASE_URL=https://elevate.ai.kr for this smoke",
    );

    const main = page.locator("main");

    await page.goto("/en", { waitUntil: "domcontentloaded" });

    const banner = page.getByRole("banner");
    await clickAndSettle(page, banner.getByRole("link", { name: "Blog" }));
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await clickAndSettle(page, banner.getByRole("link", { name: "Pricing" }));
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await clickAndSettle(page, main.locator('a[href="/#waitlist"]').first());

    await clickAndSettle(page, main.getByRole("link", { name: "Explore Prompt Studio" }));
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await clickAndSettle(page, main.getByRole("link", { name: "Browse catalog" }));
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await clickAndSettle(
      page,
      main.getByRole("link", { name: "Pricing", exact: true }).first(),
    );
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await clickAndSettle(
      page,
      main.getByRole("link", { name: /Create free account/i }).first(),
    );
    await page.goBack({ waitUntil: "domcontentloaded" });

    await clickAndSettle(page, main.locator('a[href="/#waitlist"]').nth(1));
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    const band = page
      .locator("section")
      .filter({ hasText: /Join the waitlist — beta access|beta access/i });
    await band.scrollIntoViewIfNeeded();
    await clickAndSettle(
      page,
      band.getByRole("link", { name: /Join the waitlist|Join the launch waitlist/i }),
    );

    await clickAndSettle(page, band.getByRole("link", { name: "Contact sales" }));
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await page.goto("/en/pricing", { waitUntil: "domcontentloaded" });
    const monthlyArticle = page.locator("article").filter({ hasText: /\$5\.99\s*\/\s*month/i });
    await clickAndSettle(
      page,
      monthlyArticle.getByRole("link").filter({ hasText: /Monthly|Subscribe|Switch/i }),
    );

    await page.goto("/en/pricing", { waitUntil: "domcontentloaded" });
    const annualArticle = page.locator("article").filter({ hasText: /\$47\.99\s*\/\s*year/i });
    await clickAndSettle(
      page,
      annualArticle.getByRole("link").filter({ hasText: /Annual|Subscribe|Upgrade|Save/i }),
    );

    await page.goto("/en/blog/prompt-harness-beats-prompt-hacks", {
      waitUntil: "domcontentloaded",
    });
    const postArticle = page.getByRole("article").last();
    await clickAndSettle(
      page,
      postArticle.getByRole("link", { name: "Join waitlist", exact: true }),
    );
    await page.goto("/en/blog/prompt-harness-beats-prompt-hacks", {
      waitUntil: "domcontentloaded",
    });
    await clickAndSettle(
      page,
      page.getByRole("article").last().getByRole("link", { name: "Pricing", exact: true }),
    );
  });
});
