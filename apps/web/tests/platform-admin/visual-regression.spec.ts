import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  attachSkipReason,
  evaluatePlatformAdminGate,
  loginPlatformOwner,
  openOperationsCenterPage,
} from "./_helpers/auth";
import { ROMA_VISUAL_ROUTES, localePlatformAdminPath } from "./_helpers/routes";

test.describe("ROMA Operations Center — visual regression", () => {
  test.beforeEach(async ({ page, context, baseURL }, testInfo) => {
    const gate = evaluatePlatformAdminGate(baseURL);
    if (!gate.ok) {
      await attachSkipReason(testInfo, gate);
      test.skip(true, gate.reason);
      return;
    }
    await loginPlatformOwner(context, baseURL!);
    const ready = await openOperationsCenterPage(
      page,
      baseURL!,
      ROMA_VISUAL_ROUTES[0].path,
      testInfo
    );
    if (!ready) {
      test.skip(true, "Platform owner grant required — login redirect or 403.");
    }
  });

  for (const route of ROMA_VISUAL_ROUTES) {
    test(`${route.label} shell snapshot`, async ({ page }, testInfo) => {
      const snapshotName = `${route.id}-shell.png`;
      const snapshotPath = testInfo.snapshotPath(snapshotName);
      if (!process.env.PW_TEST_UPDATE_SNAPSHOTS && !existsSync(snapshotPath)) {
        test.skip(
          true,
          `Visual baseline missing (${snapshotName}). Run bun run e2e:platform-admin:update-snapshots with owner credentials.`
        );
      }

      await page.goto(localePlatformAdminPath(route.path), {
        waitUntil: "domcontentloaded",
      });
      await page.locator("nav[aria-label='Operations Center navigation']").waitFor({ state: "visible" });
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot(snapshotName, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
        mask: [page.locator("time"), page.locator("[data-testid='build-stamp']")],
      });
    });
  }
});
