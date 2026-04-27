import { expect, test } from "@playwright/test";
import {
  attachJson,
  auditLocale,
  collectConsoleErrors,
  collectCriticalIssues,
  loginIfConfigured,
} from "./audit-helpers";

const navTargets = [
  { name: /обзор|overview/i, path: "/dashboard" },
  { name: /проекты|projects/i, path: "/dashboard/projects" },
  { name: /задачи|tasks/i, path: "/dashboard/tasks" },
  { name: /сотрудники|workers/i, path: "/dashboard/workers" },
  { name: /отчёты|reports/i, path: "/dashboard/reports" },
  { name: /согласования|approvals/i, path: "/dashboard/approvals" },
  { name: /загрузки|uploads/i, path: "/dashboard/uploads" },
  { name: /устройства и синхронизация|devices/i, path: "/dashboard/devices" },
  { name: /^ии$|^ai$/i, path: "/dashboard/ai" },
  { name: /оповещения|alerts/i, path: "/dashboard/alerts" },
  { name: /очередь push|push/i, path: "/admin/push" },
  { name: /задачи|jobs/i, path: "/admin/jobs", nth: 1 },
] as const;

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

    await loginIfConfigured(page);

    for (const target of navTargets) {
      const networkIssues = collectCriticalIssues(page);
      const consoleErrors = collectConsoleErrors(page);
      const expectedPath = `/${auditLocale}${target.path}`;

      await page.goto(`/${auditLocale}/dashboard`);
      await page.waitForLoadState("domcontentloaded");

      const navigation = page.getByRole("navigation", { name: /main/i });
      const link = navigation.getByRole("link", { name: target.name }).nth(target.nth ?? 0);
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(expectedPath)}(?:$|[?#])`));

      results.push({
        expectedPath,
        actualUrl: page.url(),
        networkIssues,
        consoleErrors,
      });
      allNetworkIssues.push(...networkIssues.map((issue) => `${target.path}: ${issue}`));
      allConsoleErrors.push(...consoleErrors.map((issue) => `${target.path}: ${issue}`));
    }

    await attachJson(testInfo, "nav-cta-results", results);
    expect(allNetworkIssues).toEqual([]);
    expect(allConsoleErrors).toEqual([]);
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
