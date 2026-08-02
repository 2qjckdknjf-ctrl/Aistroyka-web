import { expect, test } from "@playwright/test";
import { LOCALES, PROTECTED_GUEST_PATHS, isFrameworkErrorShell, localePath } from "./constants";

const DENIED_CONTENT = [
  /operations center/i,
  /platform.?admin/i,
  /tenant.?admin/i,
  /project.?finance/i,
  /internal.?margin/i,
];

async function assertGuestRedirectToLogin(
  page: import("@playwright/test").Page,
  targetPath: string,
  expectLocale?: string,
) {
  const res = await page.goto(targetPath, { waitUntil: "domcontentloaded" });
  expect(res?.status() ?? 0, `${targetPath} status`).toBeLessThan(500);

  const url = page.url();
  expect(url, `${targetPath} must land on login`).toMatch(/\/(ru|en|es|it)\/login/);
  if (expectLocale) {
    expect(url).toContain(`/${expectLocale}/login`);
  }

  // No redirect loop: single login URL, next param present for localized protected paths
  const u = new URL(url);
  expect(u.pathname).toMatch(/\/(ru|en|es|it)\/login$/);

  const body = await page.locator("body").innerText();
  expect(isFrameworkErrorShell(body)).toBe(false);
  for (const pat of DENIED_CONTENT) {
    expect(body, `${targetPath} must not leak protected chrome`).not.toMatch(pat);
  }

  // Login form present — not an empty denial page with protected shell
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
}

test.describe("Phase 3A — guest protected-surface redirects", () => {
  for (const locale of LOCALES) {
    for (const suffix of PROTECTED_GUEST_PATHS) {
      test(`guest ${locale}${suffix} → localized login`, async ({ page }) => {
        await assertGuestRedirectToLogin(page, localePath(locale, suffix), locale);
        const next = new URL(page.url()).searchParams.get("next");
        expect(next, "next should preserve attempted path").toBeTruthy();
        expect(next!).toContain(suffix.replace(/\/$/, "") || "/dashboard");
      });
    }
  }

  test("unlocalized /dashboard → en dashboard → login (no loop, no 5xx)", async ({ page }) => {
    const res = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page).toHaveURL(/\/en\/login/);
    const next = new URL(page.url()).searchParams.get("next");
    expect(next).toMatch(/\/en\/dashboard/);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("unlocalized /dashboard/ trailing → login without loop", async ({ page }) => {
    await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/);
    expect(page.url()).not.toMatch(/subscribe|checkout/);
  });

  test("guest cannot bypass via locale switch after redirect", async ({ page }) => {
    await page.goto(localePath("en", "/dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/);
    await page.goto(localePath("ru", "/dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/ru\/login/);
    expect(page.url()).not.toContain("/dashboard/projects");
  });
});
