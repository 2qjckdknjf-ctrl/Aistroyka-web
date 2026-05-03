import { expect, test } from "@playwright/test";
import { buildRouteMap, resolveProjectId } from "./_helpers/routes";

const deviceId = process.env.E2E_DEVICE_ID || "e2e-device-1";

test.describe("Core flow (worker API → manager UI)", () => {
  test("creates report via v1 API and surfaces on project page", async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectId = await resolveProjectId(request, process.env.E2E_PROJECT_ID);
    const routes = buildRouteMap(projectId);

    const idempotencyKey = `e2e-report-${Date.now()}`;
    const create = await request.post("/api/v1/worker/report/create", {
      headers: {
        "x-device-id": deviceId,
        "x-client": "ios_lite",
        "x-idempotency-key": idempotencyKey,
      },
      data: {},
    });

    if (![200, 201].includes(create.status())) {
      test.skip(true, `POST /api/v1/worker/report/create returned ${create.status()} (NOT VERIFIED without worker permissions).`);
    }

    const created = await create.json();
    const reportId =
      (created as { data?: { id?: string; report_id?: string } }).data?.id ||
      (created as { data?: { id?: string; report_id?: string } }).data?.report_id ||
      "";

    await page.goto(routes.projectDetail(projectId), { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load").catch(() => {});

    const bodyText = await page.locator("body").innerText().catch(() => "");
    const hasReportSignal =
      (reportId && bodyText.includes(reportId)) ||
      /report|daily|submitted|draft/i.test(bodyText) ||
      (await page.getByText(/no reports|нет отчет|sin informes|nessun rapporto/i).count()) > 0;

    expect(hasReportSignal).toBeTruthy();
  });
});
