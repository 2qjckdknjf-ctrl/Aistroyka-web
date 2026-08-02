/**
 * Phase 3D required helpers — never soft-skip. Preflight must exit 0 first.
 */

import { expect, type APIResponse, type BrowserContext, type Page } from "@playwright/test";
import { isIgnorablePhase3dConsoleError } from "@/lib/platform-admin/phase3d-console-guard";

export { isIgnorablePhase3dConsoleError };

export const LOCALE = process.env.E2E_LOCALE?.trim() || "en";

export const PHASE3D_PLATFORM_CABINET_PATHS = [
  "/platform-admin",
  "/platform-admin/billing",
  "/platform-admin/leads",
] as const;

export const PHASE3D_OPERATIONS_CENTER_PATHS = [
  "/platform-admin/testing",
  "/platform-admin/testing/safe-audit",
  "/platform-admin/testing/audit-runs",
  "/platform-admin/testing/quality-graph",
  "/platform-admin/testing/test-catalog",
  "/platform-admin/testing/change-intelligence",
  "/platform-admin/testing/execution-planner",
  "/platform-admin/testing/execution-engine",
  "/platform-admin/testing/web",
  "/platform-admin/testing/mobile",
  "/platform-admin/testing/backend",
  "/platform-admin/testing/ai",
  "/platform-admin/testing/security",
] as const;

export const PHASE3D_LEGACY_REDIRECTS: Record<string, string> = {
  audits: "/platform-admin/testing/safe-audit",
  history: "/platform-admin/testing/audit-runs",
  regression: "/platform-admin/testing/change-intelligence",
  coverage: "/platform-admin/testing/quality-graph",
  performance: "/platform-admin/testing",
  reports: "/platform-admin/testing",
};

export const PHASE3D_FORBIDDEN_MUTATION_PATH_PATTERNS = [
  "/api/v1/platform/testing/safe-audit/save",
  "/api/v1/platform/billing/process-pending-events",
  "/api/v1/platform/billing/reprocess-event",
  "/api/v1/platform/billing/reprocess-workspace-events",
  "/api/v1/platform/billing/pilot-workspaces",
  "/api/v1/platform/critical/",
  "/api/v1/platform/leads/bulk",
  "/api/v1/admin/flags",
] as const;

export const PHASE3D_REQUIRED_READ_APIS = [
  "/api/v1/platform/overview",
  "/api/v1/platform/health",
  "/api/v1/platform/billing/provider-status",
  "/api/v1/platform/leads",
  "/api/v1/platform/testing/quality",
  "/api/v1/platform/testing/safe-audit/runs",
] as const;

const POSITIVE_EMAIL_KEYS = [
  "ROMA_PLATFORM_OWNER_EMAIL",
  "QA_PLATFORM_OWNER_EMAIL",
  "PLATFORM_OWNER_EMAIL",
  "SMOKE_EMAIL",
] as const;
const POSITIVE_PASSWORD_KEYS = [
  "ROMA_PLATFORM_OWNER_PASSWORD",
  "QA_PLATFORM_OWNER_PASSWORD",
  "PLATFORM_OWNER_PASSWORD",
  "SMOKE_PASSWORD",
] as const;
const NEGATIVE_EMAIL_KEYS = [
  "QA_OWNER_EMAIL",
  "QA_MANAGER_EMAIL",
  "QA_WORKER_EMAIL",
  "QA_ADMIN_EMAIL",
  "E2E_USER_EMAIL",
  "E2E_EMAIL",
  "PILOT_E2E_EMAIL",
] as const;
const NEGATIVE_PASSWORD_KEYS = [
  "QA_OWNER_PASSWORD",
  "QA_MANAGER_PASSWORD",
  "QA_WORKER_PASSWORD",
  "QA_ADMIN_PASSWORD",
  "E2E_USER_PASSWORD",
  "E2E_PASSWORD",
  "PILOT_E2E_PASSWORD",
] as const;

function firstPair(
  emailKeys: readonly string[],
  passwordKeys: readonly string[]
): { email: string; password: string } {
  for (let i = 0; i < emailKeys.length; i++) {
    const email = process.env[emailKeys[i]]?.trim();
    const password = process.env[passwordKeys[i]]?.trim();
    if (email && password) return { email, password };
  }
  throw new Error("Phase 3D credentials missing after preflight — refuse soft-skip.");
}

export function positiveCredentials() {
  return firstPair(POSITIVE_EMAIL_KEYS, POSITIVE_PASSWORD_KEYS);
}

export function negativeCredentials() {
  return firstPair(NEGATIVE_EMAIL_KEYS, NEGATIVE_PASSWORD_KEYS);
}

export function localePath(pathAfterLocale: string): string {
  const p = pathAfterLocale.startsWith("/") ? pathAfterLocale : `/${pathAfterLocale}`;
  return `/${LOCALE}${p}`;
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto(localePath("/login"), { waitUntil: "domcontentloaded" });
  await expect(page.locator("#email-login-form")).toBeVisible({ timeout: 60_000 });
  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");

  const isLoginPost = (r: { url: () => string; request: () => { method: () => string } }) => {
    const u = r.url();
    return (
      (u.includes("/api/v1/auth/login") || u.includes("/api/auth/login")) &&
      r.request().method() === "POST"
    );
  };

  let status = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    await emailInput.click();
    await emailInput.fill("");
    await emailInput.pressSequentially(email, { delay: 8 });
    await passwordInput.click();
    await passwordInput.fill("");
    await passwordInput.pressSequentially(password, { delay: 8 });
    await expect(emailInput).toHaveValue(email);
    const submit = page.locator("#email-login-form").locator('button[type="submit"]');
    await expect(submit).toBeEnabled({ timeout: 10_000 });
    const loginResponse = page.waitForResponse(isLoginPost, { timeout: 90_000 });
    await submit.click();
    try {
      status = (await loginResponse).status();
    } catch {
      // Fallback: some reloads drop the response listener; accept post-login navigation.
      if (!/\/login/.test(page.url())) {
        status = 200;
        break;
      }
      status = 0;
    }
    if (status === 200) {
      await page.waitForURL(/\/(en|ru|es|it)\/(?!login)/, { timeout: 90_000 }).catch(() => undefined);
      return;
    }
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
    if (!page.url().includes("/login")) {
      await page.goto(localePath("/login"), { waitUntil: "domcontentloaded" });
      await expect(page.locator("#email-login-form")).toBeVisible({ timeout: 60_000 });
    }
  }
  expect(status, "login API").toBe(200);
}

export async function loginViaApi(context: BrowserContext, baseURL: string, email: string, password: string) {
  const res = await context.request.post(`${baseURL}/api/v1/auth/login`, {
    data: { email, password, traceId: `phase3d-${Date.now()}` },
  });
  expect(res.ok(), `loginViaApi ${res.status()}`).toBeTruthy();
}

export function attachForbiddenMutationGuard(page: Page) {
  const hits: string[] = [];
  page.on("request", (req) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method())) return;
    let pathname = "";
    try {
      pathname = new URL(req.url()).pathname;
    } catch {
      return;
    }
    for (const pat of PHASE3D_FORBIDDEN_MUTATION_PATH_PATTERNS) {
      if (pathname === pat || pathname.startsWith(pat)) {
        hits.push(`${req.method()} ${pathname}`);
      }
    }
  });
  return {
    assertClean() {
      expect(hits, `forbidden mutations: ${hits.join(" | ")}`).toEqual([]);
    },
  };
}

export function attachConsoleGuard(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isIgnorablePhase3dConsoleError(text)) return;
    if (/password|bearer|jwt|service.?role|@/i.test(text)) {
      errors.push("console_error_redacted");
      return;
    }
    errors.push(text.slice(0, 180));
  });
  page.on("pageerror", (err) => errors.push(String(err.message || err).slice(0, 180)));
  return {
    assertClean() {
      expect(errors, errors.join(" | ")).toEqual([]);
    },
  };
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    // Page-level horizontal scroll only — nested overflow-x-auto strips are intentional.
    const doc = document.documentElement;
    return doc.scrollWidth > Math.ceil(window.innerWidth) + 2;
  });
  expect(overflow, "horizontal overflow").toBe(false);
}

export async function assertOnPlatformAdmin(page: Page) {
  await expect(page).toHaveURL(/\/(en|ru|es|it)\/platform-admin/);
  await expect(page.locator("body")).not.toContainText(/application error/i);
}

export async function assertNotPlatformData(page: Page) {
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/Operations Center —|Safe Readonly Audit|Platform admin overview/i);
}

export async function readJson(res: APIResponse): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { _raw: (await res.text()).slice(0, 120) };
  }
}
