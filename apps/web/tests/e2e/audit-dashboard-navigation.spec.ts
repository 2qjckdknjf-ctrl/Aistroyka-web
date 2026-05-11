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

const navTargets = [
  { name: /обзор|overview/i, path: "/dashboard" },
  { name: /проекты|projects/i, path: "/dashboard/projects" },
  { name: /задачи|tasks/i, path: "/dashboard/tasks" },
  { name: /сотрудники|workers/i, path: "/dashboard/workers" },
  { name: /contractors|подрядчики/i, path: "/dashboard/contractors" },
  { name: /отчёты|reports/i, path: "/dashboard/reports" },
  { name: /согласования|approvals/i, path: "/dashboard/approvals" },
  { name: /загрузки|uploads/i, path: "/dashboard/uploads" },
  { name: /устройства и синхронизация|devices/i, path: "/dashboard/devices" },
  { name: /^ии$|^ai$/i, path: "/dashboard/ai" },
  { name: /оповещения|alerts/i, path: "/dashboard/alerts" },
  { name: /help center|справочник/i, path: "/dashboard/help" },
  { name: /очередь push|push/i, path: "/admin/push" },
  { name: /задачи|jobs/i, path: "/admin/jobs" },
] as const;

/** Matches `DashboardShell` `data-testid={`cta.dashboard.nav.${key}`}` (+ admin overrides). */
const SIDEBAR_PATH_TO_TESTID: Record<(typeof navTargets)[number]["path"], string> = {
  "/dashboard": "cta.dashboard.nav.overview",
  "/dashboard/projects": "cta.dashboard.nav.projects",
  "/dashboard/tasks": "cta.dashboard.nav.tasks",
  "/dashboard/workers": "cta.dashboard.nav.workers",
  "/dashboard/contractors": "cta.dashboard.nav.contractors",
  "/dashboard/reports": "cta.dashboard.nav.reports",
  "/dashboard/approvals": "cta.dashboard.nav.approvals",
  "/dashboard/uploads": "cta.dashboard.nav.uploads",
  "/dashboard/devices": "cta.dashboard.nav.devices",
  "/dashboard/ai": "cta.dashboard.nav.ai",
  "/dashboard/alerts": "cta.dashboard.nav.alerts",
  "/dashboard/help": "cta.dashboard.nav.helpCenter",
  "/admin/push": "cta.dashboard.nav.admin.push",
  "/admin/jobs": "cta.dashboard.nav.admin.jobs",
};

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

test.describe("Dashboard Navigation CTA Audit", () => {
  test("all visible dashboard shell links navigate without critical errors", async ({ page }, testInfo) => {
    test.setTimeout(180_000);

    const results: Array<{
      expectedPath: string;
      actualUrl: string;
      networkIssues: string[];
      consoleErrors: string[];
    }> = [];
    const allNetworkIssues: string[] = [];
    const allConsoleErrors: string[] = [];

    const apiIssues = attachApiIssueTracking(page);
    const consoleTracking = attachConsoleErrorTracking(page);

    await loginIfConfigured(page);
    apiIssues.drain();
    consoleTracking.drain();

    let navLocale = localeFromDashboardUrl(page.url()) ?? auditLocale;

    for (const target of navTargets) {
      apiIssues.drain();
      consoleTracking.drain();

      await page.goto(`/${navLocale}/dashboard`);
      await page.waitForLoadState("domcontentloaded");
      await page.locator("#dashboard-sidebar").waitFor({ state: "visible", timeout: 60_000 });
      navLocale = localeFromDashboardUrl(page.url()) ?? navLocale;

      const pathMatch = `${escapeRegexpPath(target.path)}(?:[?#]|$)`;
      const expectedPath = `/${navLocale}${target.path}`;

      const navigation = page.locator("#dashboard-sidebar").getByRole("navigation");
      const navTestId = SIDEBAR_PATH_TO_TESTID[target.path];
      if (!navTestId) {
        throw new Error(`SIDEBAR_PATH_TO_TESTID missing for ${target.path}`);
      }
      const link = navigation.getByTestId(navTestId);
      await expect(link).toBeVisible({ timeout: 20_000 });
      const urlRe = new RegExp(`^https?:\\/\\/[^/]+\\/(?:en|ru|es|it)${pathMatch}`);
      await Promise.all([
        page.waitForURL(urlRe, { timeout: 25_000 }),
        link.click(),
      ]);

      const networkBatch = apiIssues.drain().map(formatNetworkIssue);
      const consoleBatch = consoleTracking.drain();

      results.push({
        expectedPath,
        actualUrl: page.url(),
        networkIssues: networkBatch,
        consoleErrors: consoleBatch,
      });
      allNetworkIssues.push(...networkBatch.map((issue) => `${target.path}: ${issue}`));
      allConsoleErrors.push(...consoleBatch.map((issue) => `${target.path}: ${issue}`));
    }

    await attachJson(testInfo, "nav-cta-results", results);
    expect(allNetworkIssues).toEqual([]);
    expect(allConsoleErrors).toEqual([]);
  });
});

function escapeRegexpPath(pathname: string) {
  const escaped = pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /** Allow optional query string (e.g. `?page=1`) after the path. */
  return `${escaped}(?:\\?[^#]*)?`;
}
