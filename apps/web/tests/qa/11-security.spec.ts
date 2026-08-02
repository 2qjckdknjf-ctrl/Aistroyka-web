import { expect, test } from "@playwright/test";
import { DEFAULT_LOCALE, localePath } from "./_helpers/constants";
import fs from "node:fs";
import path from "node:path";

const SENSITIVE_PATHS = [
  "/api/v1/owner/health",
  "/api/v1/admin/metrics/overview",
  "/api/v1/ops/metrics",
  "/api/v1/debug/auth",
  "/api/_debug/auth",
  "/api/diag/supabase",
  "/api/v1/diag/supabase",
];

test.describe("Phase 13 — Security QA", () => {
  for (const apiPath of SENSITIVE_PATHS) {
    test(`sensitive endpoint ${apiPath} is not public-open`, async ({ request }) => {
      const res = await request.get(apiPath, { failOnStatusCode: false });
      expect([401, 403, 404, 405, 503]).toContain(res.status());
      const text = await res.text();
      expect(text).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE/i);
    });
  }

  test("login page does not expose env secrets in HTML", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/login"), { waitUntil: "domcontentloaded" });
    const html = await page.content();
    expect(html).not.toMatch(/sk_live_[a-zA-Z0-9]+/);
    expect(html).not.toMatch(/service_role/i);
    expect(html).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+\./);
  });

  test("open redirect blocked on login next param", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/login?next=https://evil.example.com"), {
      waitUntil: "domcontentloaded",
    });
    // Param may appear in URL before login; post-auth must not navigate off-site.
    const email = process.env.E2E_EMAIL || "qa-probe@example.com";
    await page.locator('input[type="email"], input[name="email"]').fill(email);
    await page.locator('input[type="password"]').fill("wrong-password-for-redirect-probe");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/^https?:\/\/evil\.example\.com/);
  });

  test("XSS probe in contact does not execute", async ({ page }) => {
    await page.goto(localePath(DEFAULT_LOCALE, "/contact"), { waitUntil: "domcontentloaded" });
    const probe = '<script>window.__qa_xss=1</script>';
    const input = page.locator("textarea, input[type='text']").first();
    if ((await input.count()) === 0) {
      test.skip(true, "No text input on contact — NOT VERIFIED");
    }
    await input.fill(probe);
    const xss = await page.evaluate(() => (window as unknown as { __qa_xss?: number }).__qa_xss);
    expect(xss).toBeUndefined();
  });

  test("security headers present on public page", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/${DEFAULT_LOCALE}`);
    const headers = res.headers();
    expect(headers["x-content-type-options"] || headers["content-security-policy"]).toBeTruthy();
  });

  test("generate security report artifact", async ({ request, baseURL }) => {
    const findings: Array<{ path: string; status: number; leaked: boolean }> = [];
    for (const apiPath of SENSITIVE_PATHS) {
      const res = await request.get(`${baseURL}${apiPath}`, { failOnStatusCode: false });
      const text = await res.text();
      findings.push({
        path: apiPath,
        status: res.status(),
        leaked: /service_role|sk_live|password/i.test(text),
      });
    }
    const leaked = findings.filter((f) => f.leaked);
    expect(leaked).toHaveLength(0);

    const artifactDir = process.env.QA_ARTIFACT_DIR;
    if (artifactDir) {
      fs.mkdirSync(path.join(artifactDir, "reports"), { recursive: true });
      fs.writeFileSync(path.join(artifactDir, "reports", "security.json"), JSON.stringify(findings, null, 2));
    }
  });
});
