import { expect, test } from "@playwright/test";
import path from "node:path";
import {
  attachJson,
  collectConsoleErrors,
  collectCriticalIssues,
} from "./audit-helpers";
import { buildRouteMap, e2eLocale, loadJsonInventory, resolveProjectId } from "./_helpers/routes";

type InventoryEntry = {
  id: string;
  kind: string;
  labelText: string;
  pageRoute: string;
  target: string;
  sourceFile: string;
  line: number;
  notes: string;
};

const rawInventory = loadJsonInventory<InventoryEntry>();

const actionable = rawInventory
  .filter((entry) => entry.id.startsWith("cta."))
  .filter((entry) => entry.pageRoute.startsWith("/{locale}/dashboard") || entry.pageRoute === "dashboard-shared")
  .slice(0, Number(process.env.E2E_BUTTON_AUDIT_LIMIT || 60));

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

async function concreteRoute(entry: InventoryEntry, projectId: string) {
  const route = entry.pageRoute === "dashboard-shared" ? "/{locale}/dashboard" : entry.pageRoute;
  return route
    .replace("{locale}", e2eLocale)
    .replace(":id", projectId)
    .replace(":projectId", projectId)
    .replace(/:([A-Za-z0-9_]+)/g, "missing-$1");
}

test.describe("Dashboard button audit (inventory-driven)", () => {
  test.skip(actionable.length === 0, "No stable cta.* entries in docs/audit/button_inventory.json");

  for (const entry of actionable) {
    test(`${entry.id} @ ${entry.sourceFile}:${entry.line}`, async ({ page, request }, testInfo) => {
      test.setTimeout(90_000);
      const projectId = await resolveProjectId(request, process.env.E2E_PROJECT_ID);
      const routes = buildRouteMap(projectId);

      const networkIssues = collectCriticalIssues(page);
      const consoleErrors = collectConsoleErrors(page);
      const route = await concreteRoute(entry, projectId);

      if (route.includes("missing-")) {
        test.skip(true, `Dynamic route requires env data: ${route}`);
      }

      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      const locator = entry.id.startsWith("cta.")
        ? page.getByTestId(entry.id)
        : entry.labelText
          ? page.getByRole(entry.kind === "Link" ? "link" : "button", {
              name: new RegExp(escapeRegExp(entry.labelText), "i"),
            })
          : page.locator(`[href="${entry.target}"]`);

      const count = await locator.count();
      if (count === 0) {
        test.skip(true, `CTA not visible in current E2E fixture: ${entry.id}`);
      }

      const first = locator.first();
      if (await first.isDisabled().catch(() => false)) {
        const reason = await page
          .getByText(/required|upgrade|permission|unavailable|soon/i)
          .first()
          .textContent()
          .catch(() => "");
        if (!reason) {
          test.skip(true, `Disabled CTA without visible reason: ${entry.id}`);
        }
        await attachJson(testInfo, "disabled-cta", { entry, reason });
        return;
      }

      const beforeUrl = page.url();
      const mutationPromise = page
        .waitForResponse(
          (response) => response.request().method() !== "GET" && response.url().includes("/api/"),
          { timeout: 3000 }
        )
        .catch(() => null);

      const popupOrDownload = Promise.race([
        page.waitForEvent("download", { timeout: 3000 }).then(() => "download" as const).catch(() => null),
        page.waitForEvent("popup", { timeout: 3000 }).then(() => "popup" as const).catch(() => null),
      ]);

      await first.click();
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);

      const mutation = await mutationPromise;
      const sideEffect = await popupOrDownload;
      const afterUrl = page.url();
      const modalOrDialogCount = await page
        .locator('[role="dialog"], [aria-modal="true"], dialog, [data-state="open"]')
        .count();

      const artifactRoot = process.env.AUDIT_ARTIFACT_DIR || path.join(process.cwd(), "../../docs/audit/artifacts/local");
      if (networkIssues.length || consoleErrors.length) {
        const safe = testInfo.title.replace(/[^a-z0-9]+/gi, "_");
        await page.screenshot({ path: path.join(artifactRoot, "screenshots", `${safe}.png`) }).catch(() => {});
      }

      await attachJson(testInfo, "cta-result", {
        entry,
        beforeUrl,
        afterUrl,
        mutation: mutation
          ? {
              url: mutation.url(),
              method: mutation.request().method(),
              status: mutation.status(),
            }
          : null,
        sideEffect,
        modalOrDialogCount,
        networkIssues,
        consoleErrors,
        routesHint: routes.dashboard,
      });

      const mutationOk = mutation ? mutation.status() >= 200 && mutation.status() < 300 : false;
      const passed = beforeUrl !== afterUrl || mutationOk || Boolean(sideEffect) || modalOrDialogCount > 0;

      expect(networkIssues).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(passed).toBe(true);
    });
  }
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
