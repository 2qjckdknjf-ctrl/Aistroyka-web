import { test, expect } from "@playwright/test";
import { localePath, readJson } from "./helpers";

test.describe("Phase 3D anonymous", () => {
  test("platform pages redirect to login; APIs deny without leakage", async ({ page, context }) => {
    test.setTimeout(90_000);
    await context.clearCookies();

    await page.goto(localePath("/platform-admin/testing"), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/(en|ru|es|it)\/login/, { timeout: 30_000 });
    const next = new URL(page.url()).searchParams.get("next");
    expect(next).toMatch(/\/platform-admin\/testing/);
    expect(next).not.toMatch(/^https?:\/\//);

    const overview = await page.request.get("/api/v1/platform/overview");
    expect([401, 403]).toContain(overview.status());
    const body = (await readJson(overview)) as { data?: unknown; code?: string };
    expect(body.data).toBeUndefined();

    const refresh = await page.request.post("/api/v1/platform/testing/safe-audit/refresh");
    expect([401, 403]).toContain(refresh.status());
  });
});
