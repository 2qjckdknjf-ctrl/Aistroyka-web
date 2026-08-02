/**
 * Phase 3E multi-role helpers — no soft-skip, no credential logging.
 */

import { expect, type APIResponse, type Browser, type BrowserContext, type Page } from "@playwright/test";

export const LOCALE = process.env.E2E_LOCALE?.trim() || "en";

export const FINANCE_DENY_KEYS = [
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

export type PersonaKey = "admin" | "manager" | "worker" | "stakeholder" | "smoke";

export type MePayload = {
  tenant_id: string | null;
  user_id: string | null;
  role: string | null;
};

function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function requirePair(emailKey: string, passwordKey: string, label: string): { email: string; password: string } {
  const email = env(emailKey);
  const password = env(passwordKey);
  if (!email || !password) {
    throw new Error(`Phase 3E ${label} credentials missing after preflight — refuse soft-skip.`);
  }
  return { email, password };
}

export function personaCredentials(key: PersonaKey): { email: string; password: string; label: PersonaKey } {
  switch (key) {
    case "admin":
      return { ...requirePair("QA_OWNER_EMAIL", "QA_OWNER_PASSWORD", "admin"), label: key };
    case "manager":
      return { ...requirePair("QA_MANAGER_EMAIL", "QA_MANAGER_PASSWORD", "manager"), label: key };
    case "worker":
      return { ...requirePair("QA_WORKER_EMAIL", "QA_WORKER_PASSWORD", "worker"), label: key };
    case "stakeholder":
      return { ...requirePair("QA_CLIENT_EMAIL", "QA_CLIENT_PASSWORD", "stakeholder"), label: key };
    case "smoke":
      return { ...requirePair("SMOKE_EMAIL", "SMOKE_PASSWORD", "smoke"), label: key };
    default: {
      const _exhaustive: never = key;
      throw new Error(`unknown persona ${_exhaustive}`);
    }
  }
}

export function requireE2eProjectId(): string {
  const id = env("E2E_PROJECT_ID");
  if (!id) throw new Error("E2E_PROJECT_ID required for Phase 3E — refuse soft-skip.");
  return id;
}

export function requireDeviceId(): string {
  const id = env("E2E_DEVICE_ID");
  if (!id) throw new Error("E2E_DEVICE_ID required for Phase 3E worker sync — refuse soft-skip.");
  return id;
}

export function localePath(pathAfterLocale: string): string {
  const p = pathAfterLocale.startsWith("/") ? pathAfterLocale : `/${pathAfterLocale}`;
  return `/${LOCALE}${p}`;
}

export function localeFromUrl(url: string): string {
  const m = url.match(/\/(en|ru|es|it)(?:\/|$|\?|#)/);
  return m?.[1] ?? LOCALE;
}

export async function suppressFirstLaunchGuide(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("aistroyka:first-launch-guide:v1", "1");
    } catch {
      /* ignore */
    }
  });
}

export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
  expectUrl: RegExp
): Promise<void> {
  await suppressFirstLaunchGuide(page);
  await page.goto(localePath("/login"), { waitUntil: "domcontentloaded" });
  await expect(page.locator("#email-login-form")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Supabase env missing/i)).toHaveCount(0);

  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  const submit = page.locator("#email-login-form").locator('button[type="submit"]');
  // Client hydrates envOk before enabling submit.
  await expect(submit).toBeVisible({ timeout: 60_000 });
  await expect(submit).toBeEnabled({ timeout: 60_000 });

  let status = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    await emailInput.click();
    await emailInput.fill("");
    await emailInput.pressSequentially(email, { delay: 8 });
    if ((await emailInput.inputValue()) !== email) {
      await emailInput.fill("");
      await emailInput.pressSequentially(email, { delay: 12 });
    }
    await passwordInput.click();
    await passwordInput.fill("");
    await passwordInput.pressSequentially(password, { delay: 8 });
    if ((await passwordInput.inputValue()) !== password) {
      await passwordInput.fill("");
      await passwordInput.pressSequentially(password, { delay: 12 });
    }
    await expect(emailInput).toHaveValue(email, { timeout: 10_000 });
    await expect(passwordInput).toHaveValue(password, { timeout: 10_000 });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    const loginResponse = page.waitForResponse(
      (r) =>
        (r.url().includes("/api/v1/auth/login") || r.url().includes("/api/auth/login")) &&
        r.request().method() === "POST",
      { timeout: 90_000 }
    );
    await submit.click();
    try {
      status = (await loginResponse).status();
    } catch {
      if (!/\/login/.test(page.url())) {
        status = 200;
        break;
      }
      status = 0;
    }
    if (status === 200) {
      await page.waitForURL(expectUrl, { timeout: 90_000 });
      return;
    }
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
    await page.goto(localePath("/login"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("#email-login-form")).toBeVisible({ timeout: 60_000 });
    await expect(submit).toBeEnabled({ timeout: 60_000 });
  }
  expect(status, "login API").toBe(200);
  await page.waitForURL(expectUrl, { timeout: 90_000 });
}

export async function fetchMe(page: Page): Promise<MePayload> {
  const res = await page.request.get("/api/v1/me");
  expect(res.status(), "/api/v1/me must return 200").toBe(200);
  const body = (await res.json()) as { data?: MePayload };
  expect(body.data, "/api/v1/me must include data").toBeTruthy();
  return body.data!;
}

export async function assertMeRole(page: Page, expectedRole: string): Promise<MePayload> {
  const me = await fetchMe(page);
  expect(me.user_id, "authenticated user").toBeTruthy();
  expect(me.tenant_id, "active tenant").toBeTruthy();
  expect(me.role, "runtime tenant role").toBe(expectedRole);
  return me;
}

export function collectJsonKeys(value: unknown, out = new Set<string>()): Set<string> {
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

export function assertNoFinanceLeak(payload: unknown, label: string) {
  const keys = collectJsonKeys(payload);
  for (const banned of FINANCE_DENY_KEYS) {
    expect(keys.has(banned), `${label} must not expose key ${banned}`).toBe(false);
  }
  for (const key of keys) {
    expect(key.toLowerCase().includes("internal_cost"), `${label} must not expose ${key}`).toBe(false);
  }
}

/** Forbidden business mutations for read-only Phase 3E proof. */
export const PHASE3E_FORBIDDEN_MUTATION_PATTERNS = [
  "/api/v1/platform/testing/safe-audit/save",
  "/api/v1/platform/billing/process-pending-events",
  "/api/v1/platform/billing/reprocess-event",
  "/api/v1/platform/billing/reprocess-workspace-events",
  "/api/v1/platform/critical/",
  "/api/v1/platform/leads/bulk",
  "/api/v1/admin/flags",
  "/api/v1/worker/report",
  "/api/v1/worker/day",
  "/api/v1/contact",
  "/api/contact",
  "/api/v1/invite",
] as const;

const ALLOWED_AUTH_MUTATION = [/\/api\/v1\/auth\//, /\/api\/auth\//];

function isForbiddenBusinessMutation(method: string, pathname: string): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  if (ALLOWED_AUTH_MUTATION.some((re) => re.test(pathname))) return false;
  if (/\/api\/v1\/help\//.test(pathname) || /\/api\/v1\/onboarding\//.test(pathname)) return false;
  if (pathname.includes("/safe-audit/refresh")) return false;
  // Exact create/list roots that must not mutate in Phase 3E
  if (pathname === "/api/v1/projects" && method === "POST") return true;
  if (pathname === "/api/v1/media/upload-sessions" && method === "POST") return true;
  if (pathname === "/api/v1/devices" && method === "POST") return true;
  if (/^\/api\/v1\/worker\/report(\/|$)/.test(pathname) && method === "POST") return true;
  for (const pat of PHASE3E_FORBIDDEN_MUTATION_PATTERNS) {
    if (pathname === pat || pathname.startsWith(pat + "/")) return true;
  }
  return false;
}

export function attachMutationGuard(page: Page) {
  const hits: string[] = [];
  page.on("request", (req) => {
    let pathname = "";
    try {
      pathname = new URL(req.url()).pathname;
    } catch {
      return;
    }
    if (isForbiddenBusinessMutation(req.method(), pathname)) {
      hits.push(`${req.method()} ${pathname}`);
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
  const ignore = (text: string) =>
    text.includes("favicon") ||
    text.includes("[login]") ||
    (text.includes("unsafe-eval") && text.includes("Content Security Policy")) ||
    // Auth/rate-limit/optional resource noise must not fail read-only shell proof.
    (text.includes("Failed to load resource") && /\b(404|401|403|429|503)\b/.test(text));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignore(text)) return;
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
    const doc = document.documentElement;
    return doc.scrollWidth > Math.ceil(window.innerWidth) + 2;
  });
  expect(overflow, "horizontal overflow").toBe(false);
}

export async function readJson(res: APIResponse): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { _raw: (await res.text()).slice(0, 120) };
  }
}

export async function newIsolatedContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext();
}

export async function assertStorageEmptyOfPriorSession(context: BrowserContext) {
  const cookies = await context.cookies();
  const authCookies = cookies.filter((c) => /supabase|sb-|aistroyka|auth/i.test(c.name));
  expect(authCookies, "fresh context must not carry prior auth cookies").toEqual([]);
}

/** Relative luminance for sRGB channel 0–255. */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const L1 =
    0.2126 * channelLuminance(fg[0]) +
    0.7152 * channelLuminance(fg[1]) +
    0.0722 * channelLuminance(fg[2]);
  const L2 =
    0.2126 * channelLuminance(bg[0]) +
    0.7152 * channelLuminance(bg[1]) +
    0.0722 * channelLuminance(bg[2]);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export async function assertComputedContrastSample(
  page: Page,
  selector: string,
  minRatio = 4.5
): Promise<void> {
  const sample = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    const cs = getComputedStyle(el);
    const parse = (c: string): [number, number, number] | null => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!m) return null;
      return [Number(m[1]), Number(m[2]), Number(m[3])];
    };
    let bgEl: HTMLElement | null = el;
    let bg: [number, number, number] | null = null;
    while (bgEl) {
      const b = parse(getComputedStyle(bgEl).backgroundColor);
      if (b && !(b[0] === 0 && b[1] === 0 && b[2] === 0 && getComputedStyle(bgEl).backgroundColor.includes("0)"))) {
        bg = b;
        break;
      }
      if (b && getComputedStyle(bgEl).backgroundColor.startsWith("rgb(")) {
        bg = b;
        break;
      }
      bgEl = bgEl.parentElement;
    }
    const fg = parse(cs.color);
    return { fg, bg, text: (el.textContent || "").slice(0, 40) };
  }, selector);
  expect(sample, `selector ${selector} must exist`).toBeTruthy();
  expect(sample!.fg, "foreground color").toBeTruthy();
  expect(sample!.bg, "background color").toBeTruthy();
  const ratio = contrastRatio(sample!.fg!, sample!.bg!);
  expect(ratio, `contrast for ${selector}`).toBeGreaterThanOrEqual(minRatio);
}

export function projectDetailUrlRe(projectId: string): RegExp {
  const id = projectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\/(en|ru|es|it)/(?:dashboard/)?projects/${id}(?:\\/|$|\\?|#)`);
}

export async function safeGoto(page: Page, url: string) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (/ERR_ABORTED|Navigation interrupted|NS_BINDING_ABORTED/i.test(msg)) return;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}
