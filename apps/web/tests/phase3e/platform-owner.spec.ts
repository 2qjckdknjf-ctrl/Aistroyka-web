import { expect, test } from "@playwright/test";
import {
  assertMeRole,
  assertNoHorizontalOverflow,
  attachConsoleGuard,
  attachMutationGuard,
  localePath,
  loginViaUi,
  personaCredentials,
  safeGoto,
} from "./helpers";

test.describe("Phase 3E platform owner (smoke)", () => {
  test("OWNER grant, Operations Center, no Save Snapshot", async ({ page }) => {
    const { email, password } = personaCredentials("smoke");
    const consoleGuard = attachConsoleGuard(page);
    const mutationGuard = attachMutationGuard(page);

    await loginViaUi(page, email, password, /\/(en|ru|es|it)\/(dashboard|admin|platform-admin)/);
    await assertMeRole(page, "admin");

    await safeGoto(page, localePath("/platform-admin/testing"));
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/platform-admin\/testing/);
    await expect(page.locator("body")).not.toHaveText(/^Forbidden$/i);
    await expect(page.locator("body")).toContainText(/Operations|Dashboard|ROMA|No tenant mutations/i);
    await expect(page.locator("body")).toContainText(/Read-only|No tenant mutations/i);

    // Execution Engine remains recommendation-only (copy lives on engine/planner routes).
    await safeGoto(page, localePath("/platform-admin/testing/execution-engine"));
    await expect(page).toHaveURL(/\/platform-admin\/testing\/execution-engine/);
    await expect(page.locator("body")).toContainText(
      /execution enabled:\s*false|Design only|No execution/i
    );

    await safeGoto(page, localePath("/platform-admin"));
    await expect(page).toHaveURL(/\/platform-admin/);
    await expect(page.locator("body")).not.toHaveText(/^Forbidden$/i);

    const save = page.getByRole("button", { name: /save snapshot/i });
    if ((await save.count()) > 0) {
      await expect(save.first()).toBeVisible();
      // Do not click — mutation guard would fail if network save fired.
    }

    await assertNoHorizontalOverflow(page);
    mutationGuard.assertClean();
    consoleGuard.assertClean();
  });
});
