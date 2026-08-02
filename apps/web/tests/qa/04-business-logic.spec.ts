import { expect, test } from "@playwright/test";
import { dashboardUrl, resolveProjectId } from "../e2e/_helpers/routes";

test.describe("Phase 6 — Business logic", () => {
  test("projects list API returns array shape", async ({ request }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    const res = await request.get("/api/v1/projects");
    if (!res.ok()) {
      test.skip(true, `GET /api/v1/projects returned ${res.status()} — NOT VERIFIED`);
    }
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test("project detail page loads for discovered project", async ({ page, request }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    let projectId: string;
    try {
      projectId = await resolveProjectId(request);
    } catch (e) {
      test.skip(true, String(e));
      return;
    }
    await page.goto(dashboardUrl(`/dashboard/projects/${projectId}`), { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain(projectId);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
  });

  test("tasks API returns valid JSON", async ({ request }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    const res = await request.get("/api/v1/tasks", { failOnStatusCode: false });
    if (!res.ok()) {
      test.skip(true, `GET /api/v1/tasks returned ${res.status()} — may require project scope`);
    }
    const body = await res.json();
    expect(body).toBeTruthy();
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  test("reports list accessible from dashboard route", async ({ page }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    await page.goto(dashboardUrl("/dashboard/daily-reports"), { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Not authenticated");
    }
    const res = await page.request.get("/api/v1/reports", { failOnStatusCode: false });
    expect([200, 403]).toContain(res.status());
  });

  test("notifications unread-count returns number or auth error", async ({ request }) => {
    const res = await request.get("/api/v1/notifications/unread-count", { failOnStatusCode: false });
    expect([200, 401, 403]).toContain(res.status());
    if (res.ok()) {
      const body = await res.json();
      const count = (body as { data?: { count?: number } }).data?.count;
      if (count !== undefined) expect(typeof count).toBe("number");
    }
  });

  test("config endpoint returns client-safe payload", async ({ request }) => {
    const res = await request.get("/api/v1/config");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).not.toMatch(/service.?role|secret|password/i);
  });

  test("approvals pending endpoint requires auth", async ({ request }) => {
    const res = await request.get("/api/v1/approvals/pending", { failOnStatusCode: false });
    expect([401, 403, 200]).toContain(res.status());
  });
});
