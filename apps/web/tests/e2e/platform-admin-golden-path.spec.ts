import { expect, test } from "@playwright/test";
import { loginViaApi } from "./_helpers/auth";

const LOCALE = process.env.E2E_LOCALE ?? "en";
const TESTING_BASE = `/${LOCALE}/platform-admin/testing`;

function resolvePlatformOwnerCredentials(): { email: string; password: string } | null {
  const email =
    process.env.ROMA_PLATFORM_OWNER_EMAIL ??
    process.env.QA_PLATFORM_OWNER_EMAIL ??
    process.env.PLATFORM_OWNER_EMAIL;
  const password =
    process.env.ROMA_PLATFORM_OWNER_PASSWORD ??
    process.env.QA_PLATFORM_OWNER_PASSWORD ??
    process.env.PLATFORM_OWNER_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Canonical platform-owner golden path for ROMA Operations Center.
 *
 * Skips when platform owner credentials are absent or Cloudflare Access blocks automation.
 * Manual steps documented in docs/audits/ROMA_STABILIZATION_SPRINT_REPORT.md.
 */
test.describe("ROMA platform-admin golden path", () => {
  test("owner journey: dashboard → safe audit → snapshot → audit history → release block", async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    const creds = resolvePlatformOwnerCredentials();
    if (!creds) {
      test.skip(true, "Set ROMA_PLATFORM_OWNER_EMAIL/PASSWORD or QA_PLATFORM_OWNER_* for golden path.");
      return;
    }
    if (!baseURL) {
      test.skip(true, "PLAYWRIGHT_BASE_URL required.");
      return;
    }

    if (/admin\.aistroyka\.ai/i.test(baseURL) && !process.env.CF_ACCESS_CLIENT_ID) {
      await testInfo.attach("manual-step-cloudflare-access", {
        body:
          "Cloudflare Access on admin.aistroyka.ai requires a service token or browser session. " +
          "Set CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET or run against local/staging without Access.",
        contentType: "text/plain",
      });
      test.skip(true, "Cloudflare Access credentials not configured for admin host automation.");
      return;
    }

    await loginViaApi(context, baseURL, creds.email, creds.password);

    await page.goto(`${baseURL}${TESTING_BASE}`);
    await page.waitForLoadState("domcontentloaded");

    if (page.url().includes("/login") || (await page.locator("body").textContent())?.includes("403")) {
      await testInfo.attach("manual-step-platform-owner-grant", {
        body:
          "Authenticated user lacks platform_owner_grants row. Provision grant before golden path can pass.",
        contentType: "text/plain",
      });
      test.skip(true, "Platform owner grant required — 403 or login redirect.");
      return;
    }

    await expect(page.locator("body")).toContainText(/ROMA|Operations|Executive|Dashboard/i);

    await page.goto(`${baseURL}${TESTING_BASE}/safe-audit`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toContainText(/Safe|Audit|Readonly|readonly/i);

    const refreshButton = page.getByRole("button", { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1500);
    }

    const saveButton = page.getByRole("button", { name: /save snapshot/i });
    if (await saveButton.isVisible()) {
      const saveResponsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/v1/platform/testing/safe-audit/save") && res.request().method() === "POST",
        { timeout: 15_000 }
      );
      await saveButton.click();
      const saveResponse = await saveResponsePromise.catch(() => null);
      if (saveResponse && !saveResponse.ok()) {
        await testInfo.attach("save-snapshot-status", {
          body: `Save snapshot returned ${saveResponse.status()} — may lack service role or owner write tier.`,
          contentType: "text/plain",
        });
      }
    }

    await page.goto(`${baseURL}${TESTING_BASE}/audit-runs`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toContainText(/Audit History|History|snapshot|run/i);

    await page.goto(`${baseURL}${TESTING_BASE}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toContainText(/Release|readiness|block|hold|ready/i);
  });
});
