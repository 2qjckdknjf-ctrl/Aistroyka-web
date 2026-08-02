import { test, expect, type APIResponse, type Page } from "@playwright/test";

const LOCALE = process.env.E2E_LOCALE?.trim() || "en";
const PROJECT_ID = process.env.E2E_PROJECT_ID?.trim() || "";

const FINANCE_DENY_KEYS = [
  "project_cost_items",
  "internal_cost_item_id",
  "planned_amount",
  "actual_amount",
  "margin",
  "profitability",
  "budget_pressure",
  "cost_overrun",
  "subcontractor_cost",
  "ai_finance_risk",
  "budget_delta_amount",
  "budget_impact_level",
  "internal_margin",
  "planned_cost",
  "actual_cost",
] as const;

function collectJsonKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonKeys(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out.add(k);
      collectJsonKeys(v, out);
    }
  }
  return out;
}

function assertNoFinanceLeak(payload: unknown, label: string) {
  const keys = collectJsonKeys(payload);
  for (const banned of FINANCE_DENY_KEYS) {
    expect(keys.has(banned), `${label} must not expose key ${banned}`).toBe(false);
  }
  for (const key of keys) {
    expect(key.toLowerCase().includes("internal_cost"), `${label} must not expose ${key}`).toBe(
      false
    );
  }
}

async function loginAsStakeholder(page: Page) {
  const email = process.env.QA_CLIENT_EMAIL || process.env.STAKEHOLDER_SMOKE_EMAIL;
  const password = process.env.QA_CLIENT_PASSWORD || process.env.STAKEHOLDER_SMOKE_PASSWORD;
  if (!email || !password) {
    throw new Error("Phase 3C credentials missing after preflight");
  }
  if (!PROJECT_ID) {
    throw new Error("E2E_PROJECT_ID required for Phase 3C project-detail proof");
  }

  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("aistroyka:first-launch-guide:v1", "1");
    } catch {
      /* ignore */
    }
  });

  // Login without next — G-11 post-auth must land on portal projects.
  await page.goto(`/${LOCALE}/login`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#email-login-form")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Supabase env missing/i)).toHaveCount(0);

  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  await emailInput.click();
  await emailInput.fill("");
  await emailInput.pressSequentially(email, { delay: 5 });
  await passwordInput.click();
  await passwordInput.fill("");
  await passwordInput.pressSequentially(password, { delay: 5 });
  await expect(emailInput).toHaveValue(email);

  const submit = page.locator("#email-login-form").locator('button[type="submit"]');
  await expect(submit).toBeEnabled({ timeout: 30_000 });

  const loginResponse = page.waitForResponse(
    (r) => r.url().includes("/api/v1/auth/login") && r.request().method() === "POST",
    { timeout: 60_000 }
  );
  await submit.click();
  const res = await loginResponse;
  expect(res.status(), "login API must succeed").toBe(200);
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
  expect(body.ok, "login API body.ok").toBe(true);

  await page.waitForURL(/\/(en|ru|es|it)\/portal\/projects(?:\/)?(?:\?.*)?$/, {
    timeout: 90_000,
  });
  await expect(page).toHaveURL(/\/(en|ru|es|it)\/portal\/projects/);
  await expect(page).not.toHaveURL(/\/dashboard(?:\/|$)/);
}

async function readJson(res: APIResponse): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _raw: text.slice(0, 200) };
  }
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow, "horizontal overflow").toBe(false);
}

test.describe("Phase 3C real stakeholder client portal", () => {
  test("stakeholder portal contract matrix", async ({ page }) => {
    test.setTimeout(180_000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (/favicon|Download the React DevTools|hydration|\[login\]/i.test(text)) return;
      if (/password|bearer|jwt|service.?role/i.test(text)) {
        consoleErrors.push("console_error_redacted");
        return;
      }
      consoleErrors.push(text.slice(0, 200));
    });
    page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 200)));

    // 1–2. Login without next → localized /portal/projects (G-11)
    await loginAsStakeholder(page);
    await expect(page.locator('[data-portal-shell="1"]')).toBeVisible();
    await expect(page.locator('[data-testid="cta.portal.nav.projects"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /^dashboard$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^admin$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^(team|команда)$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^ai$/i })).toHaveCount(0);

    // 3. Re-open login while authenticated → still portal projects
    await page.goto(`/${LOCALE}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/(en|ru|es|it)\/portal\/projects/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/portal\/projects/);

    // 4. /api/v1/me
    const meRes = await page.request.get("/api/v1/me");
    expect(meRes.status()).toBe(200);
    const meBody = (await readJson(meRes)) as {
      role?: string;
      tenantId?: string | null;
      tenant_id?: string | null;
      data?: {
        role?: string;
        tenantId?: string | null;
        tenant_id?: string | null;
      };
    };
    const role = meBody.role ?? meBody.data?.role;
    const tenantId =
      meBody.tenantId ??
      meBody.tenant_id ??
      meBody.data?.tenantId ??
      meBody.data?.tenant_id;
    expect(role).toBe("stakeholder");
    expect(typeof tenantId === "string" && tenantId.length > 0).toBe(true);
    const fixtureTenant = process.env.PHASE3C_FIXTURE_TENANT_ID?.trim();
    if (fixtureTenant) {
      expect(tenantId).toBe(fixtureTenant);
    }

    // Prefer session locale after auth (preference may rewrite /en → /ru).
    const loc =
      page.url().match(/\/(en|ru|es|it)(?:\/|$|\?|#)/)?.[1] ?? LOCALE;

    // 5. /portal → /portal/projects
    await page.goto(`/${loc}/portal`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/(en|ru|es|it)\/portal\/projects/, { timeout: 30_000 });
    await expect(page.locator('[data-portal-shell="1"]')).toBeVisible();

    // 7. Portal project list API — exact E2E_PROJECT_ID
    const listRes = await page.request.get("/api/v1/portal/projects");
    expect(listRes.status()).toBe(200);
    const listBody = (await readJson(listRes)) as {
      data?: Array<{ id?: string }>;
      projects?: Array<{ id?: string }>;
    };
    const projects = listBody.data ?? listBody.projects ?? [];
    expect(Array.isArray(projects)).toBe(true);
    const ids = projects.map((p) => p.id).filter(Boolean);
    expect(ids).toContain(PROJECT_ID);
    expect(ids.every((id) => id === PROJECT_ID)).toBe(true);
    assertNoFinanceLeak(listBody, "portal/projects");

    // 8–9. Project client view + APIs
    await page.goto(`/${loc}/projects/${PROJECT_ID}/client`, { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/not-found|error/i);
    await expect(page.locator("body")).not.toContainText(/application error/i);

    const clientViewRes = await page.request.get(`/api/v1/projects/${PROJECT_ID}/client-view`);
    expect(clientViewRes.status()).toBe(200);
    const clientViewBody = await readJson(clientViewRes);
    assertNoFinanceLeak(clientViewBody, "client-view");

    const portalDetailRes = await page.request.get(`/api/v1/portal/projects/${PROJECT_ID}`);
    expect(portalDetailRes.status()).toBe(200);
    const portalDetailBody = await readJson(portalDetailRes);
    assertNoFinanceLeak(portalDetailBody, "portal/projects/:id");

    // 10. Direct /dashboard/projects/:id → /client without loop
    await page.goto(`/${loc}/dashboard/projects/${PROJECT_ID}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL(
      new RegExp(`/(en|ru|es|it)/(?:dashboard/)?projects/${PROJECT_ID}/client`),
      { timeout: 30_000 }
    );
    await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_ID}/client`));
    await expect(page).not.toHaveURL(/\/dashboard\/projects\/[^/]+$/);

    // 11. Back/navigation → portal projects
    const back = page.getByRole("link", { name: /back to portal projects|назад к проектам портала|←/i }).first();
    if ((await back.count()) > 0) {
      await back.click();
      await page.waitForURL(/\/(en|ru|es|it)\/portal\/projects/, { timeout: 20_000 });
    } else {
      await page.goto(`/${loc}/portal/projects`, { waitUntil: "domcontentloaded" });
    }
    await expect(page).toHaveURL(/\/(en|ru|es|it)\/portal\/projects/);
    await expect(page).not.toHaveURL(new RegExp(`/projects/${PROJECT_ID}$`));

    // 12. Internal routes fail closed → portal home
    for (const path of [
      `/${loc}/dashboard`,
      `/${loc}/admin`,
      `/${loc}/billing`,
      `/${loc}/portfolio`,
      `/${loc}/projects`,
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForURL(/\/(en|ru|es|it)\/portal\/projects/, { timeout: 30_000 });
      await expect(page.locator('[data-portal-shell="1"]')).toBeVisible();
    }

    // 13. Costs deny — exact 403 for authenticated stakeholder
    const costsRes = await page.request.get(`/api/v1/projects/${PROJECT_ID}/costs`);
    expect(costsRes.status()).toBe(403);

    // 16. Overflow
    await page.goto(`/${loc}/portal/projects`, { waitUntil: "domcontentloaded" });
    await assertNoHorizontalOverflow(page);
    await page.goto(`/${loc}/projects/${PROJECT_ID}/client`, { waitUntil: "domcontentloaded" });
    await assertNoHorizontalOverflow(page);

    expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
    expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  });
});
