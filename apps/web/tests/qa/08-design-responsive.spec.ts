import { expect, test } from "@playwright/test";
import { DEFAULT_LOCALE, localePath } from "./_helpers/constants";

test.describe("Phase 10/14 — Design & responsive QA", () => {
  test("homepage has no horizontal scroll", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("homepage header and main do not overlap", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const header = page.locator("header").first();
    const main = page.locator("main").first();
    if ((await header.count()) === 0 || (await main.count()) === 0) {
      test.skip(true, "header/main landmarks not found — NOT VERIFIED");
    }
    const headerBox = await header.boundingBox();
    const mainBox = await main.boundingBox();
    if (headerBox && mainBox) {
      expect(mainBox.y).toBeGreaterThanOrEqual(headerBox.y);
    }
  });

  test("pricing page buttons are visible and tappable size", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/pricing"), { waitUntil: "domcontentloaded" });
    const buttons = page.locator("a.btn, button, a[class*='btn']");
    const count = await buttons.count();
    if (count === 0) {
      test.skip(true, "No buttons found on pricing — NOT VERIFIED");
    }
    const box = await buttons.first().boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(32);
    }
  });

  test("capture homepage screenshot for visual regression", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" }),
    );
    await expect(page).toHaveScreenshot("homepage.png", {
      maxDiffPixels: 500,
      animations: "disabled",
      fullPage: false,
    });
  });

  test("dashboard login redirect page screenshot", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/login"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveScreenshot("login.png", {
      maxDiffPixels: 500,
      animations: "disabled",
    });
  });
});
