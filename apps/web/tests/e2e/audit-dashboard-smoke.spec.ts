import { expect, test } from "@playwright/test";
import {
  attachApiIssueTracking,
  attachConsoleErrorTracking,
  attachJson,
  auditLocale,
  formatNetworkIssue,
  localeFromDashboardUrl,
  loginIfConfigured,
} from "./audit-helpers";

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

test.describe("Dashboard Smoke Navigation Audit", () => {
  test("login, dashboard, projects list, and project detail render without critical errors", async ({
    page,
  }, testInfo) => {
    const apiIssues = attachApiIssueTracking(page);
    const consoleIssues = attachConsoleErrorTracking(page);

    await loginIfConfigured(page);

    const navLocale = localeFromDashboardUrl(page.url()) ?? auditLocale;
    await expect(page.locator("#dashboard-sidebar").getByRole("navigation")).toBeVisible();
    await expect(
      page.locator("#dashboard-sidebar").getByRole("link", { name: /проекты|projects|proyectos|progetti/i }).first(),
    ).toBeVisible();

    await page.goto(`/${navLocale}/dashboard/projects`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(new RegExp(`/(?:en|ru|es|it)/dashboard/projects(?:[?#]|$)`));

    await expect(page.locator("body")).toContainText(/project|проект|proyecto|progetto/i);

    const projectId = process.env.E2E_PROJECT_ID;
    const firstProjectLink = page.locator("a[href*='/dashboard/projects/']").first();
    const detailHref = projectId
      ? `/${navLocale}/dashboard/projects/${projectId}`
      : (await firstProjectLink.count()) > 0
        ? await firstProjectLink.getAttribute("href")
        : null;

    if (detailHref) {
      await page.goto(detailHref.startsWith("/") ? detailHref : `/${navLocale}${detailHref}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/dashboard\/projects\/[^/?#]+/);
      await expect(page.locator("body")).toContainText(/project|проект|status|статус|overview|обзор/i);
    } else {
      await testInfo.attach("project-detail-skip", {
        body: "No E2E_PROJECT_ID provided and no project detail link was present on the projects list.",
        contentType: "text/plain",
      });
    }

    const networkIssues = apiIssues.drain().map(formatNetworkIssue);
    const consoleErrors = consoleIssues.drain();
    await attachJson(testInfo, "network-issues", networkIssues);
    await attachJson(testInfo, "console-errors", consoleErrors);
    expect(networkIssues).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
