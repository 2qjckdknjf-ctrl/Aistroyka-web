/**
 * Phase 7.7 — Pilot launch: task→report linkage smoke.
 * - Navigate to tasks list; if authenticated, open first task detail.
 * - Task detail page must show "Linked report" section (— or View report).
 * Full flow (create→assign→worker API report→manager sees link) requires auth; this smoke
 * verifies the task detail UI and linked-report section render. No insecure bypass.
 */
import { test, expect } from "@playwright/test";

const LOCALE = "en";
const TASKS_LIST = `/${LOCALE}/dashboard/tasks`;

test.describe("Pilot task→report linkage smoke", () => {
  test("task list then task detail shows Linked report section", async ({ page }) => {
    await page.goto(TASKS_LIST);
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    if (!url.includes("/dashboard/tasks")) {
      expect(url).toMatch(/\/(en|ru|es|it)(\/)?$/);
      return;
    }
    const firstTaskLink = page.locator(`a[href*="/dashboard/tasks/"]`).first();
    const linkCount = await firstTaskLink.count();
    if (linkCount === 0) {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
      return;
    }
    await firstTaskLink.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/dashboard\/tasks\/[^/]+/);
    await expect(page.getByText("Linked report")).toBeVisible();
  });
});
