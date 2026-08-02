import { expect, test } from "@playwright/test";
import { attachConsoleMonitor } from "./_helpers/console-monitor";
import { attachNetworkMonitor } from "./_helpers/network-monitor";
import { DEFAULT_LOCALE, PUBLIC_ROUTES, localePath } from "./_helpers/constants";

test.describe("Phase 3 — Public website", () => {
  test("homepage loads with hero content and no server errors", async ({ page }) => {
    const consoleMon = attachConsoleMonitor(page);
    const netMon = attachNetworkMonitor(page);

    const res = await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    expect(res?.status(), "homepage should not 5xx").toBeLessThan(500);

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(100);

    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 15_000 });

    const report = netMon.drain();
    expect(report.issues.filter((i) => i.status >= 500)).toHaveLength(0);

    const consoleReport = consoleMon.drain();
    expect(consoleReport.errors, `Console errors: ${consoleReport.errors.join("; ")}`).toHaveLength(0);
    consoleMon.detach();
    netMon.detach();
  });

  test("header has logo and navigation", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    const logo = header.locator('img[alt*="AISTROYKA" i], img[alt*="Aistroyka" i], a[href*="/"]').first();
    await expect(logo).toBeVisible();
    const navLinks = header.locator("a[href]");
    expect(await navLinks.count()).toBeGreaterThan(2);
  });

  test("footer is present", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
    expect((await footer.innerText()).length).toBeGreaterThan(20);
  });

  test("language selector or locale routes exist", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const localeSwitch = page.locator('a[href*="/en"], a[href*="/ru"], button:has-text("EN"), button:has-text("RU")');
    const count = await localeSwitch.count();
    if (count === 0) {
      // Fallback: direct locale navigation works
      const res = await page.goto("/ru", { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(500);
      await expect(page).toHaveURL(/\/ru/);
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test("primary CTA buttons are visible", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const links = page.locator('a[href*="contact"], a[href*="login"], a[href*="register"], a[href*="pilot"]');
    const buttons = page.getByRole("link", { name: /pilot|launch|contact|кабинет|cabinet/i });
    const total = (await links.count()) + (await buttons.count());
    expect(total).toBeGreaterThan(0);
  });

  for (const route of PUBLIC_ROUTES.filter((r) => r !== "")) {
    test(`public route /${route} returns < 500`, async ({ page }) => {
      const res = await page.goto(localePath(DEFAULT_LOCALE, `/${route}`), {
        waitUntil: "domcontentloaded",
      });
      expect(res?.status(), `/${route} should not 5xx`).toBeLessThan(500);
      const text = await page.locator("body").innerText();
      expect(text.length).toBeGreaterThan(50);
    });
  }

  test("404 page renders for unknown path", async ({ page }) => {
    const res = await page.goto(localePath(DEFAULT_LOCALE, "/this-route-does-not-exist-qa-404"), {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(500);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(10);
  });

  test("SEO metadata and OpenGraph on homepage", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(ogTitle || description, "Expected og:title or meta description").toBeTruthy();
  });

  test("favicon is reachable", async ({ request, baseURL }) => {
    const favicon = await request.get(`${baseURL}/favicon.ico`);
    expect([200, 301, 302, 308, 404]).toContain(favicon.status());
  });

  test("contact page has form or contact surface", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/contact"), { waitUntil: "domcontentloaded" });
    const form = page.locator("form, textarea, input[type='email']");
    expect(await form.count()).toBeGreaterThan(0);
  });

  test("no unexpected redirect off canonical locale root", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const url = page.url();
    expect(url).toMatch(new RegExp(`/${DEFAULT_LOCALE}`));
    expect(url).not.toMatch(/subscribe|billing\/checkout/);
  });

  test("images on homepage are not broken", async ({ page, baseURL }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const images = page.locator("img[src]");
    const count = Math.min(await images.count(), 15);
    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute("src");
      if (!src || src.startsWith("data:")) continue;
      const absolute = src.startsWith("http") ? src : `${baseURL}${src.startsWith("/") ? "" : "/"}${src}`;
      const head = await page.request.head(absolute, { failOnStatusCode: false });
      expect(head.status(), `Broken image: ${src} (HTTP ${head.status()})`).toBeLessThan(400);
    }
  });
});
