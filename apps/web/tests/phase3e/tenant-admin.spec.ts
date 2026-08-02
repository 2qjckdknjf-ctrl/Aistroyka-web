import { expect, test } from "@playwright/test";
import {
  assertMeRole,
  assertNoHorizontalOverflow,
  attachConsoleGuard,
  attachMutationGuard,
  localeFromUrl,
  localePath,
  loginViaUi,
  personaCredentials,
  projectDetailUrlRe,
  requireE2eProjectId,
  safeGoto,
} from "./helpers";

test.describe("Phase 3E tenant admin (non-platform)", () => {
  test("admin role, /admin, project, platform deny", async ({ page }) => {
    const { email, password } = personaCredentials("admin");
    const projectId = requireE2eProjectId();
    const consoleGuard = attachConsoleGuard(page);
    const mutationGuard = attachMutationGuard(page);

    await loginViaUi(page, email, password, /\/(en|ru|es|it)\/(dashboard|admin)/);
    await assertMeRole(page, "admin");

    const loc = localeFromUrl(page.url());
    await safeGoto(page, `/${loc}/admin`);
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/admin/);
    await expect(page.locator("body")).not.toHaveText(/^Forbidden$/i);
    await expect(page.getByTestId("cta.dashboard.nav.admin.push")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Operations Center/i);

    const list = await page.request.get("/api/v1/projects");
    expect(list.status()).toBe(200);
    const listBody = (await list.json()) as { data?: Array<{ id?: string }> };
    const ids = (listBody.data || []).map((p) => p.id);
    expect(ids).toContain(projectId);

    const api = await page.request.get(`/api/v1/projects/${projectId}`);
    expect(api.status()).toBe(200);
    await safeGoto(page, `/${loc}/projects/${projectId}`);
    if (!projectDetailUrlRe(projectId).test(page.url())) {
      await safeGoto(page, `/${loc}/dashboard/projects/${projectId}`);
    }
    await expect(page).toHaveURL(projectDetailUrlRe(projectId));
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Platform fail-closed
    await safeGoto(page, localePath("/platform-admin"));
    await expect(page.locator("body")).toHaveText(/Forbidden|403|not authorized|Access denied/i);
    const overview = await page.request.get("/api/v1/platform/overview");
    expect(overview.status()).toBe(403);

    // Portal shell must not replace dashboard for admin
    await expect(page.locator('[data-portal-shell="1"]')).toHaveCount(0);

    await assertNoHorizontalOverflow(page);
    mutationGuard.assertClean();
    consoleGuard.assertClean();
  });
});
