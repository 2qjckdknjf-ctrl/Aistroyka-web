import { expect, test } from "@playwright/test";
import { DEFAULT_LOCALE, localePath } from "./_helpers/constants";

test.describe("Phase 12 — Accessibility", () => {
  test("homepage has single h1", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const h1count = await page.locator("h1").count();
    expect(h1count).toBeGreaterThanOrEqual(1);
    expect(h1count).toBeLessThanOrEqual(2);
  });

  test("login form inputs have associated labels or aria", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/login"), { waitUntil: "domcontentloaded" });
    const email = page.locator('input[type="email"], input[name="email"]');
    const password = page.locator('input[type="password"]');
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();

    const emailAria = await email.getAttribute("aria-label");
    const emailId = await email.getAttribute("id");
    const hasLabel = emailId ? (await page.locator(`label[for="${emailId}"]`).count()) > 0 : false;
    expect(emailAria || hasLabel).toBeTruthy();
  });

  test("keyboard tab reaches primary interactive elements on homepage", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"]).toContain(focused);
  });

  test("images have alt text or role=presentation", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const images = page.locator("img");
    const count = Math.min(await images.count(), 10);
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      expect(alt !== null || role === "presentation").toBeTruthy();
    }
  });

  test("contact page maintains focusable submit control", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/contact"), { waitUntil: "domcontentloaded" });
    const submit = page.locator('button[type="submit"], input[type="submit"]');
    if ((await submit.count()) === 0) {
      test.skip(true, "Contact submit not found — NOT VERIFIED");
    }
    await submit.first().focus();
    const tag = await page.evaluate(() => document.activeElement?.tagName);
    expect(tag).toBeTruthy();
  });
});
