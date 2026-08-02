import { test, expect } from "@playwright/test";
import {
  attachConsoleGuard,
  assertNotPlatformData,
  localePath,
  loginViaUi,
  negativeCredentials,
  readJson,
} from "./helpers";

test.describe("Phase 3D negative authenticated non-grant", () => {
  test("tenant-admin without platform grant is fail-closed", async ({ page }) => {
    test.setTimeout(180_000);
    const { email, password } = negativeCredentials();
    const consoleGuard = attachConsoleGuard(page);

    await loginViaUi(page, email, password);
    await page.waitForURL(/\/(en|ru|es|it)\/(dashboard|admin|subscribe)/, {
      timeout: 90_000,
    });

    // /api/v1/me — exact tenant admin role
    const meRes = await page.request.get("/api/v1/me");
    expect(meRes.status()).toBe(200);
    const me = (await readJson(meRes)) as {
      data?: { role?: string | null; tenant_id?: string | null };
    };
    expect(me.data?.role).toBe("admin");
    expect(typeof me.data?.tenant_id === "string" && me.data.tenant_id.length > 0).toBe(true);
    const fixtureTenant = process.env.PHASE3D_FIXTURE_TENANT_ID?.trim();
    if (fixtureTenant) {
      expect(me.data?.tenant_id).toBe(fixtureTenant);
    }

    // Tenant /admin shell is accessible for tenant admin (not platform-admin)
    await page.goto(localePath("/admin"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/admin(?:\/|$|\?)/);
    await expect(page).not.toHaveURL(/\/platform-admin/);
    await expect(page.locator("body")).not.toContainText(/application error/i);
    // Dashboard shell admin nav (tenant company admin) — not Operations Center
    await expect(page.getByTestId("cta.dashboard.nav.admin.push")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("cta.dashboard.nav.admin.jobs")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Operations Center/i);

    // Platform pages fail closed for authenticated non-grant (must not be mere login redirect)
    for (const path of [
      "/platform-admin",
      "/platform-admin/testing",
      "/platform-admin/testing/safe-audit",
      "/platform-admin/billing",
      "/platform-admin/leads",
    ]) {
      const response = await page.goto(localePath(path), { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      const url = page.url();
      expect(url.includes("/login"), `${path} must not only redirect to login for authenticated denial`).toBe(
        false
      );
      const body = await page.locator("body").innerText();
      const denied =
        status === 403 ||
        /forbidden|403|access denied|недоступ/i.test(body) ||
        !url.includes("/platform-admin");
      expect(denied, `expected authenticated denial for ${path} status=${status}`).toBe(true);
      await assertNotPlatformData(page);
      await expect(page.locator('[data-portal-shell="1"]')).toHaveCount(0);
      await expect(page.getByText(/Safe Readonly Audit|ROMA Safe/i)).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: /operations/i })).toHaveCount(0);
    }

    // API exact 403 with owner gate code
    const overview = await page.request.get("/api/v1/platform/overview");
    expect(overview.status()).toBe(403);
    const overviewBody = (await readJson(overview)) as { code?: string; data?: unknown };
    expect(overviewBody.code).toBe("owner_gate");
    expect(overviewBody.data).toBeUndefined();

    const refresh = await page.request.post("/api/v1/platform/testing/safe-audit/refresh");
    expect(refresh.status()).toBe(403);

    const legacyOwner = await page.request.get("/api/v1/owner/health");
    expect(legacyOwner.status()).toBe(403);

    const legacyBilling = await page.request.get("/api/v1/admin/billing/pilot-status");
    expect(legacyBilling.status()).toBe(403);

    // Flags write gate — POST denied without mutating (no successful write)
    const flagsPost = await page.request.post("/api/v1/admin/flags", {
      data: { key: "phase3d_must_not_write" },
    });
    expect(flagsPost.status()).toBe(403);
    const flagsBody = (await readJson(flagsPost)) as { code?: string; success?: boolean };
    expect(flagsBody.success).not.toBe(true);
    expect(
      flagsBody.code === "owner_gate" || flagsBody.code === "platform_admin_required"
    ).toBe(true);

    consoleGuard.assertClean();
  });
});
