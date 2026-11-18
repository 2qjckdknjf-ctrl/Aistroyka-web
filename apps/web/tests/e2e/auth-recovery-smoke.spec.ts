/**
 * Phase 2 — auth recovery smoke (unauthenticated surfaces).
 */
import { test, expect } from "@playwright/test";

test.describe("Auth recovery smoke", () => {
  test("login page exposes forgot-password link", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page).toHaveURL(/\/en\/login/);
    const forgotLink = page.getByRole("link", { name: /Forgot password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/en\/forgot-password/);
  });

  test("forgot-password page renders form", async ({ page }) => {
    await page.goto("/en/forgot-password");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Send reset link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to log in/i })).toBeVisible();
  });

  test("reset-password page shows invalid-link state without session", async ({ page }) => {
    await page.goto("/en/reset-password");
    await expect(page.getByRole("heading", { name: /Choose a new password/i })).toBeVisible();
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /Request a new reset link/i })).toBeVisible();
  });

  test("public legal pages load without placeholder banner", async ({ page }) => {
    await page.goto("/en/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/Placeholder — legal content/i)).toHaveCount(0);

    await page.goto("/en/terms");
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText(/Placeholder — legal content/i)).toHaveCount(0);
  });
});
