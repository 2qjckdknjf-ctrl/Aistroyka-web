import { expect, test } from "@playwright/test";
import {
  AUTH_ENTRY_ROUTES,
  LOCALES,
  STATIC_PUBLIC_ROUTES,
  isFrameworkErrorShell,
  localePath,
} from "./constants";

test.describe("Phase 3A — public reachability (all locales)", () => {
  for (const locale of LOCALES) {
    for (const route of STATIC_PUBLIC_ROUTES) {
      const path = localePath(locale, route ? `/${route}` : "/");
      test(`GET ${path} non-5xx + usable body`, async ({ request }) => {
        const res = await request.get(path, { maxRedirects: 5 });
        expect(res.status(), `${path} must not 5xx`).toBeLessThan(500);
        expect(res.status(), `${path} must resolve`).toBeGreaterThanOrEqual(200);
        const body = await res.text();
        expect(body.length, `${path} empty body`).toBeGreaterThan(40);
        expect(isFrameworkErrorShell(body), `${path} framework error shell`).toBe(false);
      });
    }

    for (const route of AUTH_ENTRY_ROUTES) {
      const path = localePath(locale, `/${route}`);
      test(`GET ${path} auth entry non-5xx`, async ({ request }) => {
        const res = await request.get(path, { maxRedirects: 5 });
        expect(res.status()).toBeLessThan(500);
        expect(res.status()).toBeGreaterThanOrEqual(200);
        const body = await res.text();
        expect(isFrameworkErrorShell(body)).toBe(false);
      });
    }

    test(`${locale} unknown route usable 404/fallback (no 5xx)`, async ({ request }) => {
      const path = localePath(locale, "/this-route-does-not-exist-phase3a-404");
      const res = await request.get(path, { maxRedirects: 5 });
      expect(res.status()).toBeLessThan(500);
      const body = await res.text();
      expect(body.length).toBeGreaterThan(10);
      expect(isFrameworkErrorShell(body)).toBe(false);
    });

    test(`${locale} homepage keeps locale + Cabinet/login entry`, async ({ page }) => {
      const res = await page.goto(localePath(locale, "/"), { waitUntil: "domcontentloaded" });
      expect(res?.status() ?? 0).toBeLessThan(500);
      await expect(page).toHaveURL(new RegExp(`/${locale}(/|$|\\?)`));
      expect(isFrameworkErrorShell(await page.locator("body").innerText())).toBe(false);

      const header = page.locator("header").first();
      await expect(header).toBeVisible();
      const footer = page.locator("footer").first();
      await expect(footer).toBeVisible();

      const cabinet = page.locator(
        '[data-testid="cta.public.header.mobile.cabinet"], [data-testid="cta.public.mobile.cabinet"], a[href*="/dashboard"], a[href*="/login"]',
      );
      expect(await cabinet.count()).toBeGreaterThan(0);

      const loginLink = page.locator(`a[href*="/${locale}/login"], a[href="/login"], a[href*="/login"]`).first();
      await expect(loginLink).toBeVisible();
    });

    test(`${locale} login/register links preserve locale`, async ({ page }) => {
      await page.goto(localePath(locale, "/"), { waitUntil: "domcontentloaded" });
      const login = page.locator(`a[href*="login"]`).first();
      await login.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
      const register = page.locator(`a[href*="register"]`).first();
      await expect(register).toBeVisible();
      await register.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/register`));
      expect(page.url()).not.toMatch(/subscribe|checkout|billing/i);
    });
  }

  test("internal public nav siblings exist (en sample)", async ({ page, request }) => {
    await page.goto(localePath("en", "/"), { waitUntil: "domcontentloaded" });
    const hrefs = await page.locator("header a[href], footer a[href]").evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute("href") || "")
        .filter((h) => h.startsWith("/") && !h.startsWith("//") && !h.startsWith("/api")),
    );
    const unique = [...new Set(hrefs)].slice(0, 25);
    for (const href of unique) {
      // Skip dynamic case/docs deep links that need fixtures
      if (/\/(cases|docs)\/[^/?#]+/.test(href) && !/\/(cases|docs)\/?$/.test(href)) continue;
      const res = await request.get(href, { maxRedirects: 5 });
      expect(res.status(), `nav link ${href}`).toBeLessThan(500);
    }
  });
});
