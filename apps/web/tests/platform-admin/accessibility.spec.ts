import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  attachSkipReason,
  evaluatePlatformAdminGate,
  loginPlatformOwner,
  openOperationsCenterPage,
} from "./_helpers/auth";
import { ROMA_VISUAL_ROUTES, localePlatformAdminPath } from "./_helpers/routes";

const CRITICAL_A11Y_RULES = [
  "aria-valid-attr",
  "aria-valid-attr-value",
  "aria-required-attr",
  "aria-required-children",
  "aria-required-parent",
  "button-name",
  "color-contrast",
  "document-title",
  "heading-order",
  "landmark-one-main",
  "link-name",
  "list",
  "listitem",
  "page-has-heading-one",
  "region",
] as const;

test.describe("ROMA Operations Center — accessibility (axe)", () => {
  test.beforeEach(async ({ page, context, baseURL }, testInfo) => {
    const gate = evaluatePlatformAdminGate(baseURL);
    if (!gate.ok) {
      await attachSkipReason(testInfo, gate);
      test.skip(true, gate.reason);
      return;
    }
    await loginPlatformOwner(context, baseURL!);
    const ready = await openOperationsCenterPage(
      page,
      baseURL!,
      ROMA_VISUAL_ROUTES[0].path,
      testInfo
    );
    if (!ready) {
      test.skip(true, "Platform owner grant required — login redirect or 403.");
    }
  });

  for (const route of ROMA_VISUAL_ROUTES) {
    test(`${route.label} passes axe critical rules`, async ({ page, baseURL }) => {
      await page.goto(localePlatformAdminPath(route.path), { waitUntil: "domcontentloaded" });
      await expect(page.locator("nav[aria-label='Operations Center navigation']")).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .options({ runOnly: { type: "rule", values: [...CRITICAL_A11Y_RULES] } })
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  }

  test("navigation supports keyboard focus on first tab stop", async ({ page, baseURL }) => {
    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[0].path), {
      waitUntil: "domcontentloaded",
    });
    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"]).toContain(focusedTag);
  });

  test("active nav link exposes aria-current=page on dashboard", async ({ page, baseURL }) => {
    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[0].path), {
      waitUntil: "domcontentloaded",
    });
    const current = page.locator("a[aria-current='page']");
    await expect(current.first()).toBeVisible();
  });

  test("safe audit action buttons have accessible names", async ({ page, baseURL }) => {
    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[1].path), {
      waitUntil: "domcontentloaded",
    });
    const refresh = page.getByRole("button", { name: /refresh safe audit/i });
    const save = page.getByRole("button", { name: /save snapshot/i });
    await expect(refresh).toBeVisible();
    await expect(save).toBeVisible();
  });

  test("quality graph table is exposed to assistive tech", async ({ page, baseURL }) => {
    await page.goto(localePlatformAdminPath(ROMA_VISUAL_ROUTES[3].path), {
      waitUntil: "domcontentloaded",
    });
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
    const headers = table.locator("th");
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

function formatViolations(
  violations: { id: string; impact?: string; nodes: { html: string }[] }[]
): string {
  if (!violations.length) return "";
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.html).join("; ")}`)
    .join("\n");
}
