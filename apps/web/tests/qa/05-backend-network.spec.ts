import { expect, test } from "@playwright/test";
import { attachNetworkMonitor, formatBackendReport } from "./_helpers/network-monitor";
import { DASHBOARD_ROUTES, DEFAULT_LOCALE } from "./_helpers/constants";
import { dashboardUrl } from "../e2e/_helpers/routes";
import fs from "node:fs";
import path from "node:path";

test.describe("Phase 7 — Backend validation", () => {
  test("dashboard navigation produces no unexpected 5xx API errors", async ({ page }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    const netMon = attachNetworkMonitor(page);

    for (const route of DASHBOARD_ROUTES) {
      await page.goto(dashboardUrl(route), { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
    }

    const report = netMon.drain();
    const fivexx = report.issues.filter((i) => i.status >= 500);
    expect(fivexx, formatBackendReport(report)).toHaveLength(0);
    netMon.detach();

    const artifactDir = process.env.QA_ARTIFACT_DIR;
    if (artifactDir) {
      fs.mkdirSync(path.join(artifactDir, "reports"), { recursive: true });
      fs.writeFileSync(path.join(artifactDir, "reports", "backend-network.json"), JSON.stringify(report, null, 2));
      fs.writeFileSync(path.join(artifactDir, "reports", "backend-network.md"), formatBackendReport(report));
    }
  });

  test("health endpoints return valid JSON", async ({ request }) => {
    for (const path of ["/api/v1/health", "/api/health"]) {
      const res = await request.get(path, { failOnStatusCode: false });
      expect(res.status()).toBeLessThan(500);
      if (res.ok()) {
        const body = await res.json();
        expect(body).toBeTruthy();
      }
    }
  });

  test("auth methods returns JSON without secrets", async ({ request }) => {
    const res = await request.get(`/api/v1/auth/methods?locale=${DEFAULT_LOCALE}`);
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).not.toMatch(/service_role|sk_live|secret_key/i);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  test("invalid JSON body on login returns 4xx not 5xx", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      headers: { "Content-Type": "application/json" },
      data: "not-json",
      failOnStatusCode: false,
    });
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("unknown API path returns 404 not 500", async ({ request }) => {
    const res = await request.get("/api/v1/this-endpoint-does-not-exist-qa", { failOnStatusCode: false });
    expect([404, 405]).toContain(res.status());
  });
});
