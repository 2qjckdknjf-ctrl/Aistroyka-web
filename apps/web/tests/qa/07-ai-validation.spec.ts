import { expect, test } from "@playwright/test";
import { resolveProjectId } from "../e2e/_helpers/routes";

test.describe("Phase 9 — AI validation", () => {
  test("analyze-image without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/v1/ai/analyze-image", {
      data: { image_url: "https://example.com/test.jpg" },
      failOnStatusCode: false,
    });
    expect([401, 403, 400]).toContain(res.status());
  });

  test("copilot stream endpoint requires auth", async ({ request }) => {
    const res = await request.post("/api/v1/projects/00000000-0000-0000-0000-000000000001/copilot/chat/stream", {
      data: { message: "QA probe" },
      failOnStatusCode: false,
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test("AI response does not leak raw stack traces", async ({ request }) => {
    const res = await request.post("/api/v1/ai/analyze-image", {
      data: {},
      failOnStatusCode: false,
    });
    const text = await res.text();
    expect(text).not.toMatch(/at\s+\w+\s+\(/);
    expect(text).not.toMatch(/node_modules/);
  });

  test("project intelligence returns JSON or auth error", async ({ request }) => {
    test.skip(!process.env.E2E_EMAIL && !process.env.E2E_USER_EMAIL, "Requires auth");
    let projectId: string;
    try {
      projectId = await resolveProjectId(request);
    } catch (e) {
      test.skip(true, String(e));
      return;
    }
    const res = await request.get(`/api/v1/projects/${projectId}/intelligence`, { failOnStatusCode: false });
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const text = await res.text();
      expect(text).not.toMatch(/OPENAI_API_KEY|service_role/i);
      expect(() => JSON.parse(text)).not.toThrow();
    }
  });

  test("help assistant metrics does not expose secrets", async ({ request }) => {
    const res = await request.get("/api/v1/help/assistant/metrics", { failOnStatusCode: false });
    const text = await res.text();
    expect(text).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    expect(text).not.toMatch(/service_role/i);
  });

  test("disabled AI state: unauthenticated copilot UI redirects", async ({ page }) => {
    await page.goto("/en/dashboard/ai", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toMatch(/\/dashboard\/ai$/);
  });
});
