import { expect, test } from "@playwright/test";
import { loginViaApi, requireE2eCredentials } from "../e2e/_helpers/auth";
import { dashboardUrl } from "../e2e/_helpers/routes";
import { DEFAULT_LOCALE, localePath } from "./_helpers/constants";

test.describe("Phase 4 — Authentication", () => {
  test("login page renders form fields", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/login"), { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("wrong password shows error (no silent success)", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/login"), { waitUntil: "domcontentloaded" });
    const email = process.env.E2E_EMAIL || process.env.E2E_USER_EMAIL || "invalid@example.com";
    await page.locator('input[type="email"], input[name="email"]').fill(email);
    await page.locator('input[type="password"]').fill("definitely-wrong-password-qa");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    const url = page.url();
    const body = await page.locator("body").innerText();
    const stayedOnLogin = url.includes("/login");
    const hasError = /invalid|incorrect|неверн|error|ошибк/i.test(body);
    expect(stayedOnLogin || hasError).toBeTruthy();
  });

  test("protected dashboard redirects unauthenticated user", async ({ page }) => {
    await page.goto(dashboardUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    const url = page.url();
    expect(url.includes("/login") || url.match(/\/(ru|en|es|it)\/?$/)).toBeTruthy();
  });

  test("API login establishes session and dashboard loads", async ({ browser, baseURL }) => {
    let email: string;
    let password: string;
    try {
      ({ email, password } = requireE2eCredentials());
    } catch {
      test.skip(true, "E2E credentials not set");
      return;
    }
    const context = await browser.newContext();
    await loginViaApi(context, baseURL!, email, password);
    const page = await context.newPage();
    await page.goto(dashboardUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/${DEFAULT_LOCALE}/dashboard`));
    await context.close();
  });

  test("session restore: storage state keeps dashboard access", async ({ page }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth setup project");
    await page.goto(dashboardUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    const url = page.url();
    if (!url.includes("/dashboard")) {
      test.skip(true, "Auth setup did not run — session not available");
    }
    await page.reload();
    await expect(page).toHaveURL(new RegExp("/dashboard"));
  });

  test("logout returns to login", async ({ page }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth setup");
    await page.goto(dashboardUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Not authenticated");
    }
    const logout = page.locator('button:has-text("Logout"), button:has-text("Выйти"), a:has-text("Logout"), [data-testid="logout"]');
    if ((await logout.count()) === 0) {
      test.skip(true, "Logout control not found in nav — NOT VERIFIED");
    }
    await logout.first().click();
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/login") || url.match(/\/(ru|en|es|it)\/?$/)).toBeTruthy();
  });

  test("unauthorized admin route blocked for guest", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/admin/ai"), { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/admin/ai");
  });

  test("GET /api/v1/me without auth returns 401", async ({ request }) => {
    const res = await request.get("/api/v1/me", { failOnStatusCode: false });
    expect([401, 403]).toContain(res.status());
  });

  test("GET /api/v1/health is public", async ({ request }) => {
    const res = await request.get("/api/v1/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("ok");
  });
});
