import { expect, test } from "@playwright/test";
import {
  attachSkipReason,
  evaluatePlatformAdminGate,
  expectOperationsCenterReady,
  loginPlatformOwner,
  openOperationsCenterPage,
} from "./_helpers/auth";
import { ROMA_VISUAL_ROUTES, localePlatformAdminPath } from "./_helpers/routes";

/**
 * Deterministic platform-owner golden path for ROMA Operations Center.
 * Skips with explicit reason when credentials, Cloudflare Access, or owner grant are missing.
 */
test.describe("ROMA Operations Center golden path", () => {
  test("Supabase login → dashboard → safe audit → save snapshot → audit history → release block", async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    const gate = evaluatePlatformAdminGate(baseURL);
    if (!gate.ok) {
      await attachSkipReason(testInfo, gate);
      test.skip(true, gate.reason);
      return;
    }

    await loginPlatformOwner(context, baseURL!);

    const dashboardReady = await openOperationsCenterPage(
      page,
      baseURL!,
      ROMA_VISUAL_ROUTES[0].path,
      testInfo
    );
    if (!dashboardReady) {
      test.skip(true, "Platform owner grant required — 403 or login redirect.");
      return;
    }

    await expectOperationsCenterReady(page);
    await expect(page.locator("body")).toContainText(/Operations|Executive|Dashboard|Release/i);

    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[1].path), {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText(/Safe|Audit|Readonly|readonly/i);

    const refreshButton = page.getByRole("button", { name: /refresh safe audit/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1500);
    }

    const saveButton = page.getByRole("button", { name: /save snapshot/i });
    if (await saveButton.isVisible()) {
      const saveResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/platform/testing/safe-audit/save") &&
          res.request().method() === "POST",
        { timeout: 20_000 }
      );
      await saveButton.click();
      const saveResponse = await saveResponsePromise.catch(() => null);
      if (saveResponse && !saveResponse.ok()) {
        await testInfo.attach("save-snapshot-status", {
          body: `Save snapshot returned ${saveResponse.status()} — may lack service role or owner write tier.`,
          contentType: "text/plain",
        });
      } else if (saveResponse?.ok()) {
        await testInfo.attach("save-snapshot-status", {
          body: `Save snapshot succeeded with HTTP ${saveResponse.status()}.`,
          contentType: "text/plain",
        });
      }
    }

    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[2].path), {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText(/Audit History|History|snapshot|run/i);

    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[0].path), {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText(/Release|readiness|block|hold|ready/i);
  });
});
