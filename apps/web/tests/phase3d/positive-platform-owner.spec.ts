import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  PHASE3D_LEGACY_REDIRECTS,
  PHASE3D_OPERATIONS_CENTER_PATHS,
  PHASE3D_PLATFORM_CABINET_PATHS,
  PHASE3D_REQUIRED_READ_APIS,
  attachConsoleGuard,
  attachForbiddenMutationGuard,
  assertNoHorizontalOverflow,
  assertOnPlatformAdmin,
  localePath,
  positiveCredentials,
  readJson,
} from "./helpers";

test.describe("Phase 3D positive platform-owner", () => {
  test("anonymous → login next → Operations Center matrix", async ({ page, baseURL }) => {
    test.setTimeout(300_000);
    const { email, password } = positiveCredentials();
    const consoleGuard = attachConsoleGuard(page);
    const mutationGuard = attachForbiddenMutationGuard(page);

    // 1–2. Anonymous protected path → localized login with safe next
    const target = localePath("/platform-admin/testing");
    await page.goto(target, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/(en|ru|es|it)\/login/, { timeout: 30_000 });
    const loginUrl = new URL(page.url());
    expect(loginUrl.searchParams.get("next")).toMatch(/\/platform-admin\/testing/);

    // 3–4. Login and return via explicit next (retry on transient auth/rate-limit)
    let loginStatus = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.locator("#email").click();
      await page.locator("#email").fill("");
      await page.locator("#email").pressSequentially(email, { delay: 8 });
      await page.locator("#password").click();
      await page.locator("#password").fill("");
      await page.locator("#password").pressSequentially(password, { delay: 8 });
      const submit = page.locator("#email-login-form").locator('button[type="submit"]');
      await expect(submit).toBeEnabled({ timeout: 10_000 });
      const loginResP = page.waitForResponse(
        (r) =>
          (r.url().includes("/api/v1/auth/login") || r.url().includes("/api/auth/login")) &&
          r.request().method() === "POST"
      );
      await submit.click();
      loginStatus = (await loginResP).status();
      if (loginStatus === 200) break;
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      if (!page.url().includes("/login")) {
        await page.goto(target, { waitUntil: "domcontentloaded" });
        await page.waitForURL(/\/(en|ru|es|it)\/login/, { timeout: 30_000 });
      }
    }
    expect(loginStatus, "login status after retries").toBe(200);
    await page.waitForURL(/\/(en|ru|es|it)\/platform-admin\/testing(?:\/|$|\?)/, {
      timeout: 90_000,
    });
    // Auth cookie / RSC race: Forbidden must not stick for a granted OWNER.
    for (let attempt = 0; attempt < 3; attempt++) {
      const bodyText = (await page.locator("body").innerText()).trim();
      if (
        !/^Forbidden$/i.test(bodyText) &&
        /No tenant mutations|Operations Center navigation|Safe Readonly|ROMA/i.test(bodyText)
      ) {
        break;
      }
      await page.goto(localePath("/platform-admin/testing"), { waitUntil: "domcontentloaded" });
      await new Promise((r) => setTimeout(r, 1500));
    }
    await assertOnPlatformAdmin(page);
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/platform-admin\/testing(?:\/|$|\?)/);
    await expect(page.locator("body")).not.toHaveText(/^Forbidden$/i);
    await expect(page.getByText(/No tenant mutations/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("body")).toContainText(/Operations|Dashboard|ROMA/i);

    // 5–7. Platform shell distinct from tenant /admin
    await page.goto(localePath("/platform-admin"), { waitUntil: "domcontentloaded" });
    await assertOnPlatformAdmin(page);
    await expect(page).not.toHaveURL(/\/(en|ru|es|it)\/admin(?:\/|$)/);

    // 8. Canonical Operations Center routes
    for (const path of PHASE3D_OPERATIONS_CENTER_PATHS) {
      await page.goto(localePath(path), { waitUntil: "domcontentloaded" });
      await assertOnPlatformAdmin(page);
      await expect(page.locator("body")).not.toContainText(/application error/i);
      await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
    }

    // 9. Legacy redirects preserve locale
    for (const [legacy, dest] of Object.entries(PHASE3D_LEGACY_REDIRECTS)) {
      await page.goto(localePath(`/platform-admin/testing/${legacy}`), {
        waitUntil: "domcontentloaded",
      });
      await expect(page).toHaveURL(new RegExp(`/(en|ru|es|it)${dest.replace(/\//g, "\\/")}(?:/|\\?|$)`), {
        timeout: 30_000,
      });
    }

    // 10. Cabinet pages
    for (const path of PHASE3D_PLATFORM_CABINET_PATHS) {
      await page.goto(localePath(path), { waitUntil: "domcontentloaded" });
      await assertOnPlatformAdmin(page);
    }

    // 11. Read APIs (retry once on transient 503 while Next warms service-role)
    for (const api of PHASE3D_REQUIRED_READ_APIS) {
      let res = await page.request.get(api);
      if (res.status() === 503) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await page.request.get(api);
      }
      expect(res.status(), api).toBe(200);
      const body = await readJson(res);
      expect(body).toBeTruthy();
    }

    // 12–14. Safe Audit page — refresh allowed, never Save
    await page.goto(localePath("/platform-admin/testing/safe-audit"), {
      waitUntil: "domcontentloaded",
    });
    const refreshBtn = page.getByTestId("cta.platform.safe-audit.refresh");
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toBeEnabled({ timeout: 30_000 });
    const saveBtn = page.getByTestId("cta.platform.safe-audit.save");
    // May be visible for OWNER write roles — must not click
    if ((await saveBtn.count()) > 0) {
      await expect(saveBtn).toBeVisible();
    }
    // Session-authenticated API proof (same browser storage as UI).
    // Refresh recomputes live evidence only — never hits /safe-audit/save (mutation guard).
    const refreshApi = await page.request.post("/api/v1/platform/testing/safe-audit/refresh");
    expect(refreshApi.status()).toBe(200);
    const refreshJson = (await readJson(refreshApi)) as {
      data?: { generatedAt?: string; audit?: { createdAt?: string }; mode?: string };
    };
    expect(typeof refreshJson?.data?.generatedAt === "string").toBe(true);
    expect(refreshJson?.data?.mode).toBe("SAFE_READONLY_AUDIT");
    await expect(refreshBtn).toBeEnabled();

    // 15–16. Audit history without creating runs via save
    await page.goto(localePath("/platform-admin/testing/audit-runs"), {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText(/Audit History|snapshot|No saved audit runs/i);

    // 18. Execution Engine does not expose Run
    await page.goto(localePath("/platform-admin/testing/execution-engine"), {
      waitUntil: "domcontentloaded",
    });
    if (/\/login/.test(page.url())) {
      // Recover mid-suite session loss without skipping proof
      await page.locator("#email").fill(email);
      await page.locator("#password").fill(password);
      await page.locator("#email-login-form").locator('button[type="submit"]').click();
      await page.waitForURL(/\/(en|ru|es|it)\/platform-admin/, { timeout: 90_000 });
      await page.goto(localePath("/platform-admin/testing/execution-engine"), {
        waitUntil: "domcontentloaded",
      });
    }
    await assertOnPlatformAdmin(page);
    await expect(page.getByRole("button", { name: /^run$/i })).toHaveCount(0);
    await expect(page.locator("body")).toContainText(/execution enabled:\s*false|Design only|No execution/i);

    // Responsive spot-check
    await page.goto(localePath("/platform-admin/testing"), { waitUntil: "domcontentloaded" });
    await assertNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await assertNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page);

    // Axe on representative pages (keep set small to avoid wedging local Next)
    for (const path of [
      "/platform-admin/testing",
      "/platform-admin/testing/safe-audit",
      "/platform-admin/testing/execution-engine",
    ]) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(localePath(path), { waitUntil: "domcontentloaded" });
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();
      const critical = axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(critical, `${path} axe: ${critical.map((v) => v.id).join(",")}`).toEqual([]);
      await expect(page.locator("main")).toHaveCount(1);
    }

    // Color scheme representative
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(localePath("/platform-admin/testing"), { waitUntil: "domcontentloaded" });
    await assertOnPlatformAdmin(page);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(localePath("/platform-admin/testing/safe-audit"), {
      waitUntil: "domcontentloaded",
    });
    await assertOnPlatformAdmin(page);

    mutationGuard.assertClean();
    consoleGuard.assertClean();
    expect(baseURL).toBeTruthy();
  });
});
