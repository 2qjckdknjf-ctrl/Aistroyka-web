import { expect, test } from "@playwright/test";
import { attachConsoleGuard, localePath } from "./helpers";

const PROTECTED = [
  "/dashboard",
  "/admin",
  "/portal/projects",
  "/platform-admin",
  "/platform-admin/testing",
] as const;

test.describe("Phase 3E guest / public", () => {
  test("public home/login/register + Cabinet + protected → localized login", async ({ page }) => {
    const consoleGuard = attachConsoleGuard(page);
    const locale = process.env.E2E_LOCALE?.trim() || "en";

    const home = await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
    expect(home?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("header").first()).toBeVisible();
    const cabinet = page.locator(
      '[data-testid="cta.public.header.mobile.cabinet"], [data-testid="cta.public.mobile.cabinet"], a[href*="/dashboard"], a[href*="/login"]'
    );
    expect(await cabinet.count(), "Cabinet/login entry must be present").toBeGreaterThan(0);

    const login = await page.goto(localePath("/login"), { waitUntil: "domcontentloaded" });
    expect(login?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("#email-login-form")).toBeVisible();
    await expect(page.getByText(/Supabase env missing/i)).toHaveCount(0);

    const register = await page.goto(localePath("/register"), { waitUntil: "domcontentloaded" });
    expect(register?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toContainText(/register|sign up|регистр|registr/i);

    for (const suffix of PROTECTED) {
      const res = await page.goto(localePath(suffix), { waitUntil: "domcontentloaded" });
      expect(res?.status() ?? 0).toBeLessThan(500);
      await expect(page).toHaveURL(/\/(en|ru|es|it)\/login/);
      const next = new URL(page.url()).searchParams.get("next");
      expect(next, "safe internal next").toBeTruthy();
      expect(next!).toMatch(/^\//);
      expect(next!).not.toMatch(/^https?:\/\//i);
    }

    // Open-redirect: OAuth entry must sanitize external next (post-auth sanitize is Phase 3A covered).
    await page.goto(localePath("/login") + "?next=" + encodeURIComponent("https://evil.example"), {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/login/);
    const telegram = page.locator('a[href*="/telegram/start"]');
    if ((await telegram.count()) > 0) {
      const href = (await telegram.first().getAttribute("href")) || "";
      expect(href).not.toMatch(/evil\.example/i);
      expect(href).toMatch(/next=/);
    }

    consoleGuard.assertClean();
  });
});
