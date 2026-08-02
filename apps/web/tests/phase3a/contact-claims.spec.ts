import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, SUSPICIOUS_CLAIM_PATTERNS, localePath } from "./constants";

test.describe("Phase 3A — contact boundary + public claims", () => {
  test("contact form renders and targets /api/v1/contact (no live submit)", async ({ page }) => {
    await page.goto(localePath("en", "/contact"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    const source = readFileSync(
      join(process.cwd(), "app/[locale]/(public)/contact/ContactForm.tsx"),
      "utf8",
    );
    expect(source).toContain('fetch("/api/v1/contact"');
    expect(source).not.toContain('fetch("/api/contact"');

    // Intercept: ensure we do not generate live contact_leads in this batch
    let contactPosts = 0;
    await page.route("**/api/v1/contact", async (route) => {
      contactPosts += 1;
      await route.abort();
    });
    await page.locator("#contact-name").fill("Phase3A");
    await page.locator("#contact-email").fill("phase3a@example.com");
    await page.locator("#contact-message").fill("boundary check — do not deliver");
    // Do not click submit — source + render proof is sufficient; abort route is safety net
    expect(contactPosts).toBe(0);
  });

  for (const locale of LOCALES) {
    test(`${locale} public claims audit (homepage + pricing + features)`, async ({ page }) => {
      for (const path of ["/", "/pricing", "/features", "/contact"] as const) {
        await page.goto(localePath(locale, path), { waitUntil: "domcontentloaded" });
        const text = await page.locator("main, body").first().innerText();
        for (const pat of SUSPICIOUS_CLAIM_PATTERNS) {
          expect(text, `${locale}${path} matched ${pat}`).not.toMatch(pat);
        }
      }
    });
  }
});
