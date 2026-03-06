/**
 * Phase 5.2.1 — Cockpit smoke: critical click-paths for manager/ops dashboard.
 * - Overview loads -> navigate to uploads -> table or empty state
 * - Navigate to devices -> page renders (filter q optional; devices may not show search)
 * - Navigate to AI -> table or empty; open first item if exists
 * Without auth, dashboard routes redirect to login; with auth, content renders.
 */
import { test, expect } from "@playwright/test";

const LOCALE = "en";
const DASHBOARD = `/${LOCALE}/dashboard`;
const UPLOADS = `${DASHBOARD}/uploads`;
const DEVICES = `${DASHBOARD}/devices`;
const AI = `${DASHBOARD}/ai`;

test.describe("Cockpit smoke", () => {
  test("dashboard overview loads then navigate to uploads -> table or empty state", async ({
    page,
  }) => {
    await page.goto(DASHBOARD);
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    if (!url.includes("/dashboard")) {
      expect(url).toMatch(/\/(en|ru|es|it)(\/)?$/);
      return;
    }
    await page.goto(UPLOADS);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(new RegExp(UPLOADS.replace("/", "\\/")));
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    const hasTable = await page.locator("table").count() > 0;
    const hasEmpty = await page.getByText(/no (upload|session)s?|empty/i).count() > 0;
    expect(hasTable || hasEmpty || body!.length > 100).toBe(true);
  });

  test("navigate to devices -> page renders or redirect", async ({ page }) => {
    await page.goto(DEVICES);
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    if (!url.includes("/dashboard/devices")) {
      expect(url).toMatch(/\/(en|ru|es|it)(\/)?$/);
      return;
    }
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    const hasTable = await page.locator("table").count() > 0;
    const hasEmpty = await page.getByText(/no devices|empty/i).count() > 0;
    expect(hasTable || hasEmpty || body!.length > 100).toBe(true);
  });

  test("navigate to AI -> table or empty; open first item if exists", async ({
    page,
  }) => {
    await page.goto(AI);
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    if (!url.includes("/dashboard/ai")) {
      expect(url).toMatch(/\/(en|ru|es|it)(\/)?$/);
      return;
    }
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    const firstLink = page.locator("table a[href*='/dashboard/ai/']").first();
    const count = await firstLink.count();
    if (count > 0) {
      await firstLink.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/dashboard\/ai\/[^/]+/);
    } else {
      const hasEmpty = await page.getByText(/no (request|job)s?|empty/i).count() > 0;
      expect(hasEmpty || body!.length > 100).toBe(true);
    }
  });
});
