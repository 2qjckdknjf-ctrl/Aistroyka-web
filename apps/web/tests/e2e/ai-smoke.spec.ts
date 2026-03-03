/**
 * Minimal smoke for AI Copilot UI.
 * - App load: login page or redirect
 * - With TEST_PROJECT_ID: open project AI page and check tabs (Summary, Explain Risk, Copilot)
 */
import { test, expect } from "@playwright/test";

test.describe("AI Copilot smoke", () => {
  test("app loads and shows auth or dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(ru|en|es|it)(\/|$)/);
    const content = await page.textContent("body");
    expect(content?.length).toBeGreaterThan(0);
  });

  test("locale login page has content", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page).toHaveURL(/\/en\/login/);
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("project AI page shows Copilot tabs when project exists", async ({
    page,
  }) => {
    const projectId = process.env.TEST_PROJECT_ID;
    if (!projectId) {
      test.skip();
      return;
    }
    await page.goto(`/en/projects/${projectId}/ai`);
    await page.waitForLoadState("domcontentloaded");
    const summaryTab = page.getByRole("button", { name: /Summary/i });
    const explainTab = page.getByRole("button", { name: /Explain Risk/i });
    const copilotTab = page.getByRole("button", { name: /Copilot/i });
    await expect(summaryTab).toBeVisible();
    await expect(explainTab).toBeVisible();
    await expect(copilotTab).toBeVisible();
  });

  test("429 + Retry-After shows error banner and request_id with copy", async ({
    page,
  }) => {
    const projectId = process.env.TEST_PROJECT_ID;
    if (!projectId) {
      test.skip();
      return;
    }
    const mockRequestId = "e2e-mock-429-id";
    await page.route("**/functions/v1/aistroyka-llm-copilot**", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "3",
          "X-Request-Id": mockRequestId,
        },
        body: JSON.stringify({ error: "rate limited", request_id: mockRequestId }),
      });
    });
    await page.goto(`/en/projects/${projectId}/ai`);
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: /^Run$/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/rate limit|try again/i)).toBeVisible();
    await expect(page.getByText("Request ID:", { exact: false })).toBeVisible();
    const copyBtn = page.getByRole("button", { name: /Copy request ID/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  });

  test("Copilot chat: send message, user + assistant messages and request_id visible (P2.1 server)", async ({
    page,
  }) => {
    const projectId = process.env.TEST_PROJECT_ID;
    if (!projectId) {
      test.skip();
      return;
    }
    const mockRequestId = "e2e-chat-mock-id";
    const mockThreadId = "e2e-thread-1";
    await page.route("**/functions/v1/aistroyka-ai-chat**", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const body = route.request().postDataJSON() as { action?: string; project_id?: string; thread_id?: string; user_text?: string };
      if (body?.action === "list_threads") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [] }),
        });
        return;
      }
      if (body?.action === "get_thread") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              thread: { id: mockThreadId, project_id: projectId, status: "active" },
              messages: [
                { id: "m1", thread_id: mockThreadId, role: "user", content: "What is the risk?", request_id: null, error_kind: null, low_confidence: false, created_at: new Date().toISOString() },
                { id: "m2", thread_id: mockThreadId, role: "assistant", content: "E2E reply to: What is the risk?", request_id: mockRequestId, error_kind: null, low_confidence: false, created_at: new Date().toISOString() },
              ],
            },
          }),
        });
        return;
      }
      if (body?.action === "send_chat_message") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              thread_id: mockThreadId,
              request_id: mockRequestId,
              assistant_content: "E2E reply to: " + (body?.user_text ?? ""),
              low_confidence: false,
              fallback_reason: null,
              error_category: null,
              ok: true,
            },
          }),
        });
        return;
      }
      if (body?.action === "create_thread") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { id: mockThreadId, project_id: projectId, status: "active" } }),
        });
        return;
      }
      if (body?.action === "archive_thread") {
        await route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) });
        return;
      }
      await route.continue();
    });
    await page.goto(`/en/projects/${projectId}/ai`);
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: /Copilot/i }).click();
    await expect(page.getByPlaceholder(/Ask about risk/i)).toBeVisible();
    await page.getByPlaceholder(/Ask about risk/i).fill("What is the risk?");
    await page.getByRole("button", { name: /^Send$/i }).click();
    await expect(page.getByText("What is the risk?")).toBeVisible();
    await expect(page.getByText(/E2E reply to:/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Request ID:", { exact: false }).or(page.getByText(mockRequestId))).toBeVisible();
  });
});

test.describe("Admin AI Observability smoke", () => {
  test("unauthenticated user visiting /admin/ai is redirected", async ({
    page,
  }) => {
    await page.goto("/en/admin/ai");
    await page.waitForLoadState("domcontentloaded");
    // Layout guard: non-admin redirects to default locale root
    const url = page.url();
    expect(url).not.toContain("/admin/ai");
    expect(url).toMatch(/\/(en|ru|es|it)(\/)?$/);
  });

  test("unauthenticated user visiting /admin/ai/requests is redirected", async ({
    page,
  }) => {
    await page.goto("/en/admin/ai/requests");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(url).not.toContain("/admin/");
    expect(url).toMatch(/\/(en|ru|es|it)(\/)?$/);
  });

  test("admin AI overview page structure when Edge is mocked (with auth)", async ({
    page,
  }) => {
    // Mock admin-ai Edge so that if user were admin, KPIs would load
    await page.route("**/functions/v1/aistroyka-admin-ai**", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const body = route.request().postDataJSON() as { action?: string };
      if (body?.action === "get_ai_usage_summary") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              requests: 42,
              errors: 1,
              error_rate: 0.024,
              p95_ms: 1200,
              retrieval_low_confidence_rate: 0.05,
              budget_exceeded_count: 0,
            },
          }),
        });
        return;
      }
      if (body?.action === "get_ai_breaker_state") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [{ key: "copilot", state: "closed" }] }),
        });
        return;
      }
      if (body?.action === "list_recent_issues") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [] }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto("/en/admin/ai");
    await page.waitForLoadState("domcontentloaded");
    // Without auth we get redirected; with auth we'd see the dashboard
    const url = page.url();
    if (url.includes("/admin/ai") && !url.includes("/admin/ai/security") && !url.includes("/admin/ai/requests")) {
      await expect(page.getByText("AI Observability")).toBeVisible();
      await expect(page.getByText("Requests today", { exact: false }).or(page.getByText("No admin tenants"))).toBeVisible({ timeout: 5000 });
    }
  });

  test("request_id explorer: input and mock result render", async ({
    page,
  }) => {
    const mockRequestId = "e2e-admin-request-id-1";
    await page.route("**/functions/v1/aistroyka-admin-ai**", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const body = route.request().postDataJSON() as { action?: string; request_id?: string };
      if (body?.action === "get_request_by_id" && body?.request_id === mockRequestId) {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              llm: {
                id: "llm-1",
                created_at: new Date().toISOString(),
                mode: "chat_qa",
                total_ms: 800,
                latency_ms: 800,
                tokens_used: 100,
                fallback_used: false,
                fallback_reason: null,
                error_category: null,
                groundedness_passed: true,
                retrieval_used: true,
                retrieval_count: 5,
                retrieval_avg_similarity: 0.72,
                injection_detected: false,
                security_blocked: false,
                tenant_id: null,
                project_id: null,
              },
              retrieval_logs: [],
              chat_messages: [],
            },
          }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto("/en/admin/ai/requests");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    if (!url.includes("/admin/ai/requests")) return; // redirected (no auth)
    await expect(page.getByText("Request ID explorer", { exact: false })).toBeVisible();
    await page.getByPlaceholder(/Paste request_id/i).fill(mockRequestId);
    await page.waitForTimeout(400); // debounce 300ms
    // If we're on the page and mock responds, we should see mode or "No data"
    await expect(
      page.getByText("chat_qa").or(page.getByText("No data for this request"))
    ).toBeVisible({ timeout: 6000 });
  });
});
