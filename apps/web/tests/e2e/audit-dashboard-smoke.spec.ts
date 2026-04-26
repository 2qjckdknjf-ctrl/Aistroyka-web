import { expect, test } from "@playwright/test";
import {
  attachJson,
  auditLocale,
  collectConsoleErrors,
  collectCriticalIssues,
  loginIfConfigured,
} from "./audit-helpers";

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

test.describe("Dashboard Smoke Navigation Audit", () => {
  test("login, dashboard, projects list, and project detail render without critical errors", async ({
    page,
  }, testInfo) => {
    const networkIssues = collectCriticalIssues(page);
    const consoleErrors = collectConsoleErrors(page);

    await loginIfConfigured(page);
    await expect(page.getByRole("navigation", { name: /main/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /проекты|projects|proyectos|progetti/i }).first()).toBeVisible();

    await page.goto(`/${auditLocale}/dashboard/projects`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(new RegExp(`/${auditLocale}/dashboard/projects`));
    await expect(page.locator("body")).toContainText(/project|проект|proyecto|progetto/i);

    const projectId = process.env.E2E_PROJECT_ID;
    const firstProjectLink = page.locator("a[href*='/dashboard/projects/']").first();
    const detailHref = projectId
      ? `/${auditLocale}/dashboard/projects/${projectId}`
      : (await firstProjectLink.count()) > 0
        ? await firstProjectLink.getAttribute("href")
        : null;

    if (detailHref) {
      await page.goto(detailHref.startsWith("/") ? detailHref : `/${auditLocale}${detailHref}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/dashboard\/projects\/[^/?#]+/);
      await expect(page.locator("body")).toContainText(/project|проект|status|статус|overview|обзор/i);
    } else {
      await testInfo.attach("project-detail-skip", {
        body: "No E2E_PROJECT_ID provided and no project detail link was present on the projects list.",
        contentType: "text/plain",
      });
    }

    await attachJson(testInfo, "network-issues", networkIssues);
    await attachJson(testInfo, "console-errors", consoleErrors);
    expect(networkIssues).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
