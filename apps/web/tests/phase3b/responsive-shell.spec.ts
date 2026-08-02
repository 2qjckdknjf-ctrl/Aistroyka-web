/**
 * Mobile dashboard shell + one representative admin page (owner persona).
 */

import { expect, test } from "@playwright/test";
import {
  anyLocalePathRe,
  assertAdminNavVisible,
  assertMeRole,
  login,
  resolvePersonas,
} from "./helpers";

test("mobile sidebar and admin page without horizontal overflow", async ({ page }) => {
  const { admin } = resolvePersonas();
  const loc = await login(page, admin);
  await assertMeRole(page, { roleOneOf: ["owner", "admin"], requireTenant: true });

  await page.goto(`/${loc}/dashboard`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("cta.dashboard.nav.overview")).toBeVisible();

  const openBtn = page.locator('button[aria-controls="dashboard-sidebar"]');
  if (await openBtn.isVisible()) {
    await openBtn.click();
    await expect(page.locator("#dashboard-sidebar")).toBeVisible();
    const closeBtn = page.locator('button[aria-controls="dashboard-sidebar"][aria-expanded="true"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  await page.goto(`/${loc}/admin/jobs`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(anyLocalePathRe("/admin/jobs"));
  await expect(page.locator("h1, h2").first()).toBeVisible();
  await assertAdminNavVisible(page);

  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth + 1;
  });
  expect(overflow, "dashboard/admin must not horizontally overflow on mobile").toBe(false);
});
