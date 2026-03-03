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

  test("Copilot chat: send message, user + assistant messages and request_id visible", async ({
    page,
  }) => {
    const projectId = process.env.TEST_PROJECT_ID;
    if (!projectId) {
      test.skip();
      return;
    }
    const mockRequestId = "e2e-chat-mock-id";
    await page.route("**/functions/v1/aistroyka-llm-copilot**", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const body = route.request().postDataJSON();
      const userQuestion = body?.user_question ?? "";
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": mockRequestId },
        body: JSON.stringify({
          text: `E2E reply to: ${userQuestion}`,
          summary: `E2E reply to: ${userQuestion}`,
          request_id: mockRequestId,
          groundedness_passed: true,
        }),
      });
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
