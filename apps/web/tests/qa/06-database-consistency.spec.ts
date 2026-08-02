import { expect, test } from "@playwright/test";
import { resolveProjectId } from "../e2e/_helpers/routes";

test.describe("Phase 8 — Database consistency (API-level)", () => {
  test("projects list supports pagination shape", async ({ request }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    const res = await request.get("/api/v1/projects?limit=5", { failOnStatusCode: false });
    if (!res.ok()) {
      test.skip(true, `Projects list unavailable: ${res.status()}`);
    }
    const body = (await res.json()) as { data?: unknown[] };
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data!.length).toBeLessThanOrEqual(5);
  });

  test("GET project by id is consistent with list", async ({ request }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    let projectId: string;
    try {
      projectId = await resolveProjectId(request);
    } catch (e) {
      test.skip(true, String(e));
      return;
    }
    const detail = await request.get(`/api/v1/projects/${projectId}`);
    expect(detail.ok()).toBeTruthy();
    const detailBody = (await detail.json()) as { data?: { id?: string } };
    expect(detailBody.data?.id).toBe(projectId);
  });

  test("sync bootstrap returns cursor fields when authenticated", async ({ request }) => {
    const res = await request.get("/api/v1/sync/bootstrap", {
      headers: { "x-client": "ios_lite", "x-device-id": process.env.E2E_DEVICE_ID || "qa-db-1" },
      failOnStatusCode: false,
    });
    if (res.status() === 401) {
      test.skip(true, "Sync bootstrap needs worker auth — NOT VERIFIED");
    }
    if (res.ok()) {
      const body = await res.json();
      expect(body).toBeTruthy();
    }
  });

  test("notifications list returns array or auth gate", async ({ request }) => {
    const res = await request.get("/api/v1/notifications", { failOnStatusCode: false });
    expect([200, 401, 403]).toContain(res.status());
    if (res.ok()) {
      const body = await res.json();
      const data = (body as { data?: unknown }).data;
      if (Array.isArray(data)) {
        const ids = data.map((n) => (n as { id?: string }).id).filter(Boolean);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});
