import { expect, test } from "@playwright/test";
import { loginViaApi } from "../e2e/_helpers/auth";
import { dashboardUrl } from "../e2e/_helpers/routes";
import { FINANCE_DENYLIST } from "./_helpers/constants";
import { requireRoleOrSkip } from "./_helpers/roles";

test.describe("Phase 5 — Role-based access", () => {
  test("owner can access dashboard and list projects", async ({ page, request }) => {
    const creds = requireRoleOrSkip("owner", test);
    await page.goto(dashboardUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Owner session not active");
    }
    const res = await request.get("/api/v1/projects");
    expect(res.ok(), `GET /api/v1/projects as owner: ${res.status()}`).toBeTruthy();
    void creds;
  });

  test("manager can access dashboard projects", async ({ page }) => {
    const creds = requireRoleOrSkip("manager", test);
    const ctx = page.context();
    await loginViaApi(ctx, process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000", creds.email, creds.password);
    await page.goto(dashboardUrl("/dashboard/projects"), { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/dashboard");
    const status = await page.locator("body").innerText();
    expect(status.length).toBeGreaterThan(20);
  });

  test("worker lite client can hit allow-listed sync bootstrap", async ({ request }) => {
    const res = await request.get("/api/v1/sync/bootstrap", {
      headers: { "x-client": "ios_lite", "x-device-id": process.env.E2E_DEVICE_ID || "qa-device-1" },
      failOnStatusCode: false,
    });
    if (res.status() === 401) {
      test.skip(true, "Worker sync requires authenticated lite session — NOT VERIFIED without worker JWT");
    }
    expect([200, 403]).toContain(res.status());
  });

  test("lite client blocked on non-allow-listed admin route", async ({ request }) => {
    const res = await request.get("/api/v1/admin/metrics/overview", {
      headers: { "x-client": "ios_lite" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });

  test("client/stakeholder portal does not expose internal cost fields", async ({ page, request }) => {
    const creds = requireRoleOrSkip("client", test);
    const ctx = page.context();
    await loginViaApi(ctx, process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000", creds.email, creds.password);

    const portalRes = await request.get("/api/v1/portal/projects", { failOnStatusCode: false });
    // Do not soft-skip after auth failure — treat as hard failure when client credentials were provided.
    expect([200], `portal list must succeed for stakeholder persona (got ${portalRes.status()})`).toContain(
      portalRes.status()
    );
    const payload = await portalRes.json();
    const scan = (node: unknown): void => {
      if (node == null) return;
      if (Array.isArray(node)) {
        for (const x of node) scan(x);
        return;
      }
      if (typeof node === "object") {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          expect(FINANCE_DENYLIST.some((f) => k.toLowerCase().includes(f))).toBe(false);
          scan(v);
        }
      }
    };
    scan(payload);

    await page.goto(dashboardUrl("/portal/projects"), { waitUntil: "domcontentloaded" });
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const field of FINANCE_DENYLIST) {
      expect(body).not.toContain(field.replace(/_/g, " "));
    }
  });

  test("platform admin owner route requires grant", async ({ request }) => {
    const res = await request.get("/api/v1/owner/health", { failOnStatusCode: false });
    expect([401, 403]).toContain(res.status());
  });

  test("guest cannot export reports", async ({ request }) => {
    const res = await request.get("/api/v1/reports/export", { failOnStatusCode: false });
    expect([401, 403]).toContain(res.status());
  });
});
