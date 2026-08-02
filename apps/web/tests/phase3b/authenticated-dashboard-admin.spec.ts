/**
 * Phase 3B authenticated dashboard / tenant-admin specs.
 * Runtime roles from /api/v1/me — never trust variable names alone.
 */

import { expect, test, type Page } from "@playwright/test";
import {
  anyLocaleDashboardRe,
  anyLocalePathRe,
  assertAdminNavAbsent,
  assertAdminNavVisible,
  assertMeRole,
  attachConsoleGuard,
  attachRequiredApiGuard,
  localeFromUrl,
  login,
  requireE2eProjectId,
  resolvePersonas,
} from "./helpers";

const ADMIN_PATHS = ["/admin", "/admin/jobs", "/admin/push", "/admin/system"] as const;

/** Accept both `/projects/:id` and `/dashboard/projects/:id` product surfaces. */
function projectDetailUrlRe(projectId: string): RegExp {
  const id = projectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\/(en|ru|es|it)/(?:dashboard/)?projects/${id}(?:\\/|$|\\?|#)`);
}

async function safeGoto(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Locale middleware / soft navigation often aborts the first navigation.
    if (!/ERR_ABORTED|Navigation interrupted|NS_BINDING_ABORTED/i.test(msg)) {
      throw err;
    }
  }
}

async function gotoProjectDetail(page: Page, loc: string, projectId: string) {
  const api = await page.request.get(`/api/v1/projects/${projectId}`);
  expect(api.status(), "project must be readable via API before UI proof").toBe(200);

  const observedLoc = localeFromUrl(page.url()) || loc;
  const candidates = [
    `/${observedLoc}/projects/${projectId}`,
    `/${observedLoc}/dashboard/projects/${projectId}`,
    `/ru/projects/${projectId}`,
    `/en/projects/${projectId}`,
    `/ru/dashboard/projects/${projectId}`,
    `/en/dashboard/projects/${projectId}`,
  ];

  for (const url of candidates) {
    await safeGoto(page, url);
    if (!projectDetailUrlRe(projectId).test(page.url())) continue;
    if ((await page.getByRole("heading", { name: /page not found/i }).count()) > 0) continue;
    // Prefer a rendered project heading / shell over the global not-found.
    const hasShell = (await page.locator("h1, h2").count()) > 0;
    if (hasShell) break;
  }

  await expect(page).toHaveURL(projectDetailUrlRe(projectId));
  await expect(page.getByRole("heading", { name: /page not found/i })).toHaveCount(0);
  await expect(page.locator("h1, h2").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Something went wrong|Application error/i);
}

test.describe("Phase 3B owner/admin persona", () => {
  test("runtime owner/admin role, dashboard, admin surfaces, project detail", async ({
    page,
  }) => {
    const { admin } = resolvePersonas();
    const projectId = requireE2eProjectId();
    const apiGuard = attachRequiredApiGuard(page);
    const consoleGuard = attachConsoleGuard(page);

    const loc = await login(page, admin);

    const me = await assertMeRole(page, {
      roleOneOf: ["owner", "admin"],
      requireTenant: true,
    });
    expect(me.role === "owner" || me.role === "admin").toBe(true);

    await expect(page.getByTestId("cta.dashboard.nav.overview")).toBeVisible();
    await assertAdminNavVisible(page);

    await page.goto(`/${loc}/projects`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(anyLocalePathRe("/projects"));
    await expect(page.locator("h1, h2").first()).toBeVisible();

    await gotoProjectDetail(page, loc, projectId);
    expect(page.url()).not.toMatch(/\/login/);

    for (const path of ADMIN_PATHS) {
      await page.goto(`/${loc}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(anyLocalePathRe(path));
      await expect(page.locator("h1, h2").first()).toBeVisible();
      expect(page.url()).toMatch(/\/admin(?:\/|$)/);
    }

    // Tenant-admin must remain distinct from platform Operations Center.
    await page.goto(`/${loc}/admin`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(anyLocalePathRe("/admin"));
    const tenantAdminBody = (await page.locator("body").innerText()).toLowerCase();
    expect(tenantAdminBody).not.toMatch(/operations center|roma qa|safe readonly audit/i);

    // Platform-admin is separately gated (may allow platform_owner grants on smoke).
    await page.goto(`/${loc}/platform-admin`, { waitUntil: "domcontentloaded" });
    expect(page.url()).toMatch(/\/(en|ru|es|it)\/(login|dashboard|platform-admin)/);
    if (/\/platform-admin(?:\/|$)/.test(page.url())) {
      expect(page.url()).toMatch(/\/platform-admin(?:\/|$|\?|#)/);
    }

    apiGuard.assertClean();
    consoleGuard.assertClean();
    apiGuard.detach();
  });
});

test.describe("Phase 3B non-admin persona", () => {
  test("runtime member role, no admin nav, /admin denial, project detail", async ({ page }) => {
    const { admin, nonAdmin } = resolvePersonas();
    const projectId = requireE2eProjectId();
    const consoleGuard = attachConsoleGuard(page);

    await login(page, admin);
    const ownerMe = await assertMeRole(page, {
      roleOneOf: ["owner", "admin"],
      requireTenant: true,
    });
    expect(Boolean(ownerMe.tenant_id)).toBe(true);
    const ownerTenantHash = ownerMe.tenant_id!;

    await page.context().clearCookies();
    const loc = await login(page, nonAdmin);

    const memberMe = await assertMeRole(page, {
      roleExact: "member",
      requireTenant: true,
    });
    expect(memberMe.tenant_id, "active tenant must match owner persona").toBe(ownerTenantHash);
    expect(memberMe.role).toBe("member");

    await expect(page.getByTestId("cta.dashboard.nav.overview")).toBeVisible();
    await assertAdminNavAbsent(page);

    await gotoProjectDetail(page, loc, projectId);
    expect(page.url()).not.toMatch(/\/login/);
    await expect(page.locator("body")).not.toContainText(/Something went wrong|Application error/i);

    for (const path of ADMIN_PATHS) {
      await page.goto(`/${loc}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(anyLocaleDashboardRe());
      expect(page.url()).not.toMatch(/\/admin(?:\/|$)/);
      await expect(page.getByRole("heading", { name: /jobs|observability|ai system/i })).toHaveCount(0);
    }

    await page.goto(`/${loc}/platform-admin`, { waitUntil: "domcontentloaded" });
    const after = page.url();
    expect(/\/(en|ru|es|it)\/(login|dashboard|platform-admin)/.test(after)).toBe(true);
    if (/\/platform-admin(?:\/|$)/.test(after)) {
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.toLowerCase()).not.toMatch(/operations center|safe readonly audit/i);
    }

    await page.goto(`/${loc}/dashboard`, { waitUntil: "domcontentloaded" });
    await assertAdminNavAbsent(page);

    consoleGuard.assertClean();
  });
});
