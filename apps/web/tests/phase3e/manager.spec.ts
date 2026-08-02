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

test.describe("Phase 3E manager", () => {
  test("member tenant role, manager project, admin/platform deny", async ({ page }) => {
    const { email, password } = personaCredentials("manager");
    const projectId = requireE2eProjectId();
    const consoleGuard = attachConsoleGuard(page);
    const mutationGuard = attachMutationGuard(page);

    await loginViaUi(page, email, password, /\/(en|ru|es|it)\/dashboard/);
    await assertMeRole(page, "member");

    const loc = localeFromUrl(page.url());
    await expect(page.getByTestId("cta.dashboard.nav.admin.push")).toHaveCount(0);
    await expect(page.locator('[data-portal-shell="1"]')).toHaveCount(0);

    const list = await page.request.get("/api/v1/projects");
    expect(list.status()).toBe(200);
    const listBody = (await list.json()) as { data?: Array<{ id?: string }> };
    expect((listBody.data || []).map((p) => p.id)).toContain(projectId);

    const api = await page.request.get(`/api/v1/projects/${projectId}`);
    expect(api.status()).toBe(200);

    await safeGoto(page, `/${loc}/projects/${projectId}`);
    if (!projectDetailUrlRe(projectId).test(page.url())) {
      await safeGoto(page, `/${loc}/dashboard/projects/${projectId}`);
    }
    await expect(page).toHaveURL(projectDetailUrlRe(projectId));
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Operations Center|Platform admin/i);

    await safeGoto(page, `/${loc}/admin`);
    // Tenant admin unavailable for member — login redirect or forbidden / dashboard bounce
    const adminUrl = page.url();
    const body = await page.locator("body").innerText();
    const denied =
      /\/login/.test(adminUrl) ||
      /Forbidden|403|not authorized|Access denied|недостаточно/i.test(body) ||
      (/\/dashboard/.test(adminUrl) && !/\/admin/.test(adminUrl));
    expect(denied, "manager must not use tenant /admin").toBeTruthy();

    await safeGoto(page, localePath("/platform-admin"));
    {
      const platformBody = await page.locator("body").innerText();
      expect(platformBody).toMatch(/Forbidden|403|not authorized|Access denied|login/i);
    }

    // Foreign project probe: well-formed UUID unlikely in fixture → 404/403, not 200
    const foreign = "00000000-0000-4000-8000-000000000099";
    if (foreign !== projectId) {
      const foreignRes = await page.request.get(`/api/v1/projects/${foreign}`);
      expect([403, 404]).toContain(foreignRes.status());
    }

    await assertNoHorizontalOverflow(page);
    mutationGuard.assertClean();
    consoleGuard.assertClean();
  });
});
