import { expect, test } from "@playwright/test";
import { hasE2ELoginCredentials } from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";

test.describe("productions → editor entry", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );

  test("opens episode detail then enters fullscreen editor", async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto("/dashboard/productions", { waitUntil: "networkidle" });

    const episodeHref = await page.evaluate(() => {
      const RESERVED = new Set([
        "new",
        "projects",
        "channels",
        "integrations",
      ]);
      const hrefs = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          'a[href^="/dashboard/productions/"]',
        ),
      ).map((a) => a.getAttribute("href") || "");
      return (
        hrefs.find((href) => {
          const m = href.match(/^\/dashboard\/productions\/([^/?#]+)(?:[?#].*)?$/);
          if (!m) return false;
          return !RESERVED.has(m[1]);
        }) ??
        null
      );
    });

    test.skip(
      episodeHref === null,
      "No production episode rows found for this E2E user/org in current environment.",
    );

    const detailPath = (episodeHref ?? "").split("?")[0].split("#")[0];
    await page.goto(detailPath, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(`${detailPath.replace(/\//g, "\\/")}`));

    // CTA visibility can vary by layout breakpoint; route access is the
    // contract we care about for smoke.
    await page.goto(`${detailPath}/editor`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/dashboard\/productions\/[^/]+\/editor/);
    await expect(page.locator("[data-editor-shell]")).toBeVisible();
  });
});

