import { expect, test } from "@playwright/test";
import { localePath } from "./constants";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "mobile-portrait", width: 390, height: 844 },
] as const;

const PAGES = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "pricing", path: "/pricing" },
  { name: "contact", path: "/contact" },
] as const;

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
}

test.describe("Phase 3A — responsive + accessibility baseline", () => {
  for (const vp of VIEWPORTS) {
    for (const p of PAGES) {
      test(`${vp.name} ${p.name}: layout + primary controls`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(localePath("en", p.path), { waitUntil: "domcontentloaded" });
        await assertNoHorizontalOverflow(page);

        const h1 = page.locator("h1").first();
        await expect(h1).toBeVisible();
        const h1Box = await h1.boundingBox();
        expect(h1Box, "h1 must have geometry").toBeTruthy();
        expect(h1Box!.y).toBeGreaterThanOrEqual(0);

        if (p.name === "home") {
          const header = page.locator("header").first();
          await expect(header).toBeVisible();
          if (vp.width < 900) {
            // Mobile: cabinet entry must remain reachable (header CTA or menu)
            const cabinet = page.locator(
              '[data-testid*="cabinet"], a[href*="/dashboard"], a[href*="/login"]',
            );
            expect(await cabinet.count()).toBeGreaterThan(0);
            // Try opening mobile nav if a menu button exists
            const menuBtn = page.locator(
              'header button[aria-label*="menu" i], header button[aria-expanded], [data-testid*="menu"]',
            );
            if ((await menuBtn.count()) > 0) {
              await menuBtn.first().click();
            }
          }
        }

        if (p.name === "login" || p.name === "contact") {
          const submit = page.locator('button[type="submit"]').first();
          await expect(submit).toBeVisible();
          const box = await submit.boundingBox();
          expect(box).toBeTruthy();
          expect(box!.height).toBeGreaterThanOrEqual(32);
        }
      });
    }
  }

  test("homepage a11y: heading count, landmarks, images, keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(localePath("en", "/"), { waitUntil: "domcontentloaded" });

    const h1count = await page.locator("h1").count();
    expect(h1count).toBeGreaterThanOrEqual(1);
    expect(h1count).toBeLessThanOrEqual(2);

    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.locator("main, [role='main']").first()).toBeVisible();
    await expect(page.locator("footer").first()).toBeVisible();

    const images = page.locator("img");
    const count = Math.min(await images.count(), 12);
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      const ariaHidden = await img.getAttribute("aria-hidden");
      expect(
        alt !== null || role === "presentation" || ariaHidden === "true",
        `img[${i}] needs alt or decorative marker`,
      ).toBeTruthy();
    }

    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]).toContain(focused);
  });

  test("login a11y: labeled inputs + accessible names on controls", async ({ page }) => {
    await page.goto(localePath("en", "/login"), { waitUntil: "domcontentloaded" });
    const email = page.locator("#email");
    const password = page.locator("#password");
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    const submit = page.locator('#email-login-form button[type="submit"]');
    await expect(submit).toBeVisible();
    const name = ((await submit.getAttribute("aria-label")) || (await submit.innerText())).trim();
    expect(name.length).toBeGreaterThan(0);
  });

  test("contact a11y: labeled fields + required client validation", async ({ page }) => {
    await page.goto(localePath("en", "/contact"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator("#contact-message")).toBeVisible();
    await expect(page.locator('label[for="contact-name"]')).toBeVisible();
    await expect(page.locator('label[for="contact-email"]')).toBeVisible();
    await expect(page.locator('label[for="contact-message"]')).toBeVisible();

    const submit = page.locator('button[type="submit"]').first();
    await submit.click();
    // HTML5 required should keep us on contact without posting
    await expect(page).toHaveURL(/\/en\/contact/);
  });
});
