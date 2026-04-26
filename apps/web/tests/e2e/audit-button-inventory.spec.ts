import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  attachJson,
  auditLocale,
  collectConsoleErrors,
  collectCriticalIssues,
  loginIfConfigured,
} from "./audit-helpers";

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

const inventoryPath = path.join(process.cwd(), "../../docs/audit/button_inventory.json");
const rawInventory = fs.existsSync(inventoryPath)
  ? (JSON.parse(fs.readFileSync(inventoryPath, "utf8")) as InventoryEntry[])
  : [];

const actionable = rawInventory
  .filter((entry) => entry.id.startsWith("cta."))
  .filter((entry) => entry.pageRoute.startsWith("/{locale}/dashboard") || entry.pageRoute === "dashboard-shared")
  .slice(0, Number(process.env.E2E_BUTTON_AUDIT_LIMIT || 60));

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

function concreteRoute(entry: InventoryEntry) {
  const projectId = process.env.E2E_PROJECT_ID || "missing-project-id";
  const route = entry.pageRoute === "dashboard-shared" ? "/{locale}/dashboard" : entry.pageRoute;
  return route
    .replace("{locale}", auditLocale)
    .replace(":id", projectId)
    .replace(":projectId", projectId)
    .replace(/:([A-Za-z0-9_]+)/g, "missing-$1");
}

test.describe("Button Click Audit (Inventory-Driven)", () => {
  test.skip(actionable.length === 0, "No stable cta.* selectors were present in the generated inventory");

  test.beforeEach(async ({ page }) => {
    await loginIfConfigured(page);
  });

  for (const entry of actionable) {
    test(`${entry.id} @ ${entry.sourceFile}:${entry.line}`, async ({ page }, testInfo) => {
      const networkIssues = collectCriticalIssues(page);
      const consoleErrors = collectConsoleErrors(page);
      const route = concreteRoute(entry);

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
        await attachJson(testInfo, "disabled-cta", entry);
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
