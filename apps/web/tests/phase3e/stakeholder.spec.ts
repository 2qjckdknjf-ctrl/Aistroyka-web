import { expect, test } from "@playwright/test";
import {
  assertMeRole,
  assertNoFinanceLeak,
  assertNoHorizontalOverflow,
  attachConsoleGuard,
  attachMutationGuard,
  localeFromUrl,
  localePath,
  loginViaUi,
  personaCredentials,
  readJson,
  requireE2eProjectId,
  safeGoto,
} from "./helpers";

test.describe("Phase 3E stakeholder / customer finance", () => {
  test("portal-only, client-view, finance deny", async ({ page }) => {
    const { email, password } = personaCredentials("stakeholder");
    const projectId = requireE2eProjectId();
    const consoleGuard = attachConsoleGuard(page);
    const mutationGuard = attachMutationGuard(page);

    await loginViaUi(page, email, password, /\/(en|ru|es|it)\/portal\/projects/);
    await assertMeRole(page, "stakeholder");

    await expect(page.locator('[data-portal-shell="1"]')).toBeVisible();
    await expect(page.getByTestId("cta.dashboard.nav.admin.push")).toHaveCount(0);

    const portalList = await page.request.get("/api/v1/portal/projects");
    expect(portalList.status()).toBe(200);
    const portalBody = (await portalList.json()) as { data?: Array<{ id?: string }> };
    const portalIds = (portalBody.data || []).map((p) => p.id);
    expect(portalIds).toContain(projectId);
    assertNoFinanceLeak(portalBody, "portal/projects");

    const clientView = await page.request.get(`/api/v1/projects/${projectId}/client-view`);
    expect(clientView.status()).toBe(200);
    assertNoFinanceLeak(await readJson(clientView), "client-view");

    const portalDetail = await page.request.get(`/api/v1/portal/projects/${projectId}`);
    expect(portalDetail.status()).toBe(200);
    assertNoFinanceLeak(await readJson(portalDetail), "portal detail");

    await safeGoto(page, localePath(`/portal/projects/${projectId}`));
    await expect(page).toHaveURL(/\/portal\/projects\//);
    await expect(page.locator("body")).not.toContainText(/margin|profitability|budget pressure|internal cost/i);

    const costs = await page.request.get(`/api/v1/projects/${projectId}/costs`);
    expect(costs.status()).toBe(403);

    const loc = localeFromUrl(page.url());
    // Contractor internal surfaces → portal home (Phase 3C contract)
    for (const denied of ["/dashboard", "/admin", "/billing", "/portfolio", "/projects"]) {
      await safeGoto(page, `/${loc}${denied}`);
      await page.waitForURL(/\/(en|ru|es|it)\/portal\/projects/, { timeout: 30_000 });
      await expect(page.locator('[data-portal-shell="1"]')).toBeVisible();
    }

    // Platform-admin is grant-gated Forbidden (not portal shell) — no Operations Center data
    await safeGoto(page, localePath("/platform-admin"));
    const platformBody = await page.locator("body").innerText();
    expect(platformBody).toMatch(/Forbidden|403|not authorized|Access denied/i);
    expect(platformBody).not.toMatch(/Operations Center —|Platform admin overview|Safe Readonly Audit/i);
    const overview = await page.request.get("/api/v1/platform/overview");
    expect(overview.status()).toBe(403);

    await assertNoHorizontalOverflow(page);
    mutationGuard.assertClean();
    consoleGuard.assertClean();
  });
});
