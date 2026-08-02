import { expect, test } from "@playwright/test";
import { DEFAULT_LOCALE } from "./_helpers/constants";
import fs from "node:fs";
import path from "node:path";

test.describe("Phase 11 — Performance", () => {
  test("homepage first load under budget", async ({ page }) => {
    const budgetMs = Number(process.env.QA_PERF_BUDGET_MS ?? 8000);
    const start = Date.now();
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "load" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(budgetMs);

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return {
        domContentLoaded: nav?.domContentLoadedEventEnd ?? 0,
        loadEventEnd: nav?.loadEventEnd ?? 0,
      };
    });

    const artifactDir = process.env.QA_ARTIFACT_DIR;
    if (artifactDir) {
      fs.mkdirSync(path.join(artifactDir, "reports"), { recursive: true });
      fs.writeFileSync(
        path.join(artifactDir, "reports", "performance.json"),
        JSON.stringify({ elapsed, metrics, budgetMs }, null, 2),
      );
    }
  });

  test("navigation to pricing is responsive", async ({ page }) => {
    await page.goto(`/${DEFAULT_LOCALE}`, { waitUntil: "domcontentloaded" });
    const start = Date.now();
    await page.goto(`/${DEFAULT_LOCALE}/pricing`, { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(Number(process.env.QA_NAV_BUDGET_MS ?? 5000));
  });

  test("health API latency under threshold", async ({ request }) => {
    const start = Date.now();
    const res = await request.get("/api/v1/health");
    const elapsed = Date.now() - start;
    expect(res.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(Number(process.env.QA_API_BUDGET_MS ?? 2000));
  });
});
