/**
 * Phase 3B shared helpers — no soft-skips after unexpected results.
 * Never log emails, passwords, tokens, or IDs.
 */

import { expect, type Page, type Response } from "@playwright/test";

export const locale = process.env.E2E_LOCALE || "en";

/** Locale segment after auth (session preference may override E2E_LOCALE). */
export function localeFromUrl(url: string): string {
  const m = url.match(/\/(en|ru|es|it)(?:\/|$|\?|#)/);
  return m?.[1] ?? locale;
}

export function anyLocaleDashboardRe(): RegExp {
  return /\/(en|ru|es|it)\/dashboard(?:\/|$|\?|#)/;
}

export function anyLocalePathRe(pathAfterLocale: string): RegExp {
  const escaped = pathAfterLocale.replace(/\//g, "\\/");
  return new RegExp(`\\/(en|ru|es|it)${escaped}(?:\\/|$|\\?|#)`);
}

export type Persona = {
  label: "admin" | "nonAdmin";
  email: string;
  password: string;
};

export type MePayload = {
  tenant_id: string | null;
  user_id: string | null;
  role: string | null;
};

export function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function requireE2eProjectId(): string {
  const id = env("E2E_PROJECT_ID");
  if (!id) {
    throw new Error("E2E_PROJECT_ID is required for Phase 3B project-detail proof — do not soft-skip.");
  }
  return id;
}

export function resolvePersonas(): { admin: Persona; nonAdmin: Persona } {
  const admin =
    (env("QA_OWNER_EMAIL") &&
      env("QA_OWNER_PASSWORD") && {
        label: "admin" as const,
        email: env("QA_OWNER_EMAIL")!,
        password: env("QA_OWNER_PASSWORD")!,
      }) ||
    (env("E2E_USER_EMAIL") &&
      env("E2E_USER_PASSWORD") && {
        label: "admin" as const,
        email: env("E2E_USER_EMAIL")!,
        password: env("E2E_USER_PASSWORD")!,
      }) ||
    (env("E2E_EMAIL") &&
      env("E2E_PASSWORD") && {
        label: "admin" as const,
        email: env("E2E_EMAIL")!,
        password: env("E2E_PASSWORD")!,
      }) ||
    (env("PILOT_E2E_EMAIL") &&
      env("PILOT_E2E_PASSWORD") && {
        label: "admin" as const,
        email: env("PILOT_E2E_EMAIL")!,
        password: env("PILOT_E2E_PASSWORD")!,
      });

  const nonAdmin =
    (env("QA_MANAGER_EMAIL") &&
      env("QA_MANAGER_PASSWORD") && {
        label: "nonAdmin" as const,
        email: env("QA_MANAGER_EMAIL")!,
        password: env("QA_MANAGER_PASSWORD")!,
      }) ||
    (env("QA_WORKER_EMAIL") &&
      env("QA_WORKER_PASSWORD") && {
        label: "nonAdmin" as const,
        email: env("QA_WORKER_EMAIL")!,
        password: env("QA_WORKER_PASSWORD")!,
      });

  if (!admin || !nonAdmin) {
    throw new Error("Phase 3B personas missing — preflight should have blocked. Do not soft-skip.");
  }
  if (admin.email.toLowerCase() === nonAdmin.email.toLowerCase()) {
    throw new Error("Phase 3B refuses to reuse one account as both admin and non-admin personas.");
  }
  return { admin, nonAdmin };
}

/** Suppress first-launch modal so it cannot intercept navigation (localStorage only). */
export async function suppressFirstLaunchGuide(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("aistroyka:first-launch-guide:v1", "1");
    } catch {
      // ignore
    }
  });
}

export async function dismissFirstLaunchGuideIfOpen(page: Page) {
  const start = page.getByRole("button", {
    name: /start working|начать работу|empezar a trabajar|inizia a lavorare/i,
  });
  if ((await start.count()) > 0 && (await start.first().isVisible().catch(() => false))) {
    await start.first().click();
  }
}

export async function login(page: Page, persona: Persona): Promise<string> {
  await suppressFirstLaunchGuide(page);
  await page.goto(`/${locale}/login`);
  await page.locator("#email").fill(persona.email);
  await page.locator("#password").fill(persona.password);
  await page.locator("#email-login-form").locator('button[type="submit"]').click();
  await page.waitForURL(/\/(en|ru|es|it)\/(dashboard|admin|subscribe)/, {
    timeout: 90_000,
  });
  expect(page.url(), "login must land on authenticated route").toMatch(
    /\/(en|ru|es|it)\/(dashboard|admin|subscribe)/
  );
  if (page.url().includes("/subscribe")) {
    throw new Error(
      `${persona.label} landed on subscribe — subscription gate blocks Phase 3B proof (not soft-skip).`
    );
  }
  // Session locale preference may rewrite /en → /ru after first paint.
  await page.waitForLoadState("domcontentloaded");
  await page.waitForURL(/\/(en|ru|es|it)\/(dashboard|admin)/, { timeout: 30_000 });
  let loc = localeFromUrl(page.url());
  await page.goto(`/${loc}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/(en|ru|es|it)\/dashboard/, { timeout: 30_000 });
  loc = localeFromUrl(page.url());
  await dismissFirstLaunchGuideIfOpen(page);
  return loc;
}

export async function fetchMe(page: Page): Promise<MePayload> {
  const res = await page.request.get("/api/v1/me");
  expect(res.status(), "/api/v1/me must return 200").toBe(200);
  const body = (await res.json()) as { data?: MePayload };
  expect(body.data, "/api/v1/me must include data").toBeTruthy();
  return body.data!;
}

export async function assertMeRole(
  page: Page,
  expected: { roleOneOf?: string[]; roleExact?: string; requireTenant: boolean }
): Promise<MePayload> {
  const me = await fetchMe(page);
  expect(me.user_id, "authenticated user must exist").toBeTruthy();
  if (expected.requireTenant) {
    expect(me.tenant_id, "active tenant must be present").toBeTruthy();
  }
  if (expected.roleExact) {
    expect(me.role, "runtime role must match exactly").toBe(expected.roleExact);
  }
  if (expected.roleOneOf) {
    expect(expected.roleOneOf, "runtime role must be in allowed set").toContain(me.role);
  }
  return me;
}

export async function assertAdminNavVisible(page: Page) {
  await expect(page.getByTestId("cta.dashboard.nav.admin.push")).toBeVisible();
  await expect(page.getByTestId("cta.dashboard.nav.admin.jobs")).toBeVisible();
}

export async function assertAdminNavAbsent(page: Page) {
  await expect(page.getByTestId("cta.dashboard.nav.admin.push")).toHaveCount(0);
  await expect(page.getByTestId("cta.dashboard.nav.admin.jobs")).toHaveCount(0);
}

export function attachRequiredApiGuard(page: Page) {
  const unexpected: string[] = [];
  const onResponse = (response: Response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    const status = response.status();
    const method = response.request().method();
    const pathOnly = (() => {
      try {
        return new URL(url).pathname.replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
          "[id]"
        );
      } catch {
        return "/api/[unparsed]";
      }
    })();

    // Optional background help/assistant telemetry must not fail Phase 3B shell proof.
    const optionalBackground =
      /\/api\/v1\/help\//.test(pathOnly) ||
      /\/api\/v1\/onboarding\//.test(pathOnly) ||
      /\/api\/v1\/support\//.test(pathOnly);

    if (status >= 500) {
      if (optionalBackground) return;
      unexpected.push(`${method} ${status} ${pathOnly}`);
      return;
    }
    if (status >= 400) {
      const allowedNegative =
        /\/api\/v1\/admin\//.test(url) ||
        /\/api\/v1\/platform\//.test(url) ||
        /\/api\/v1\/owner\//.test(url);
      if (!allowedNegative && method === "GET" && !optionalBackground) {
        unexpected.push(`${method} ${status} ${pathOnly}`);
      }
    }
  };
  page.on("response", onResponse);
  return {
    assertClean() {
      expect(unexpected, "unexpected required API errors").toEqual([]);
    },
    detach() {
      page.off("response", onResponse);
    },
  };
}

export function attachConsoleGuard(page: Page) {
  const errors: string[] = [];
  const ignore = (text: string) =>
    text.includes("favicon") ||
    text.includes("[login]") ||
    (text.includes("unsafe-eval") && text.includes("Content Security Policy")) ||
    (text.includes("Failed to load resource") && /\b404\b/.test(text)) ||
    (text.includes("Failed to load resource") && /\b503\b/.test(text)) ||
    (text.includes("Failed to load resource") && /\b403\b/.test(text)) ||
    (text.includes("Failed to load resource") && /\b401\b/.test(text));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignore(text)) return;
    // Do not capture credential-bearing text.
    if (/password|bearer|jwt|service.?role/i.test(text)) {
      errors.push("console_error_redacted");
      return;
    }
    errors.push(text.slice(0, 200));
  });
  page.on("pageerror", (err) => {
    errors.push((err.message || "pageerror").slice(0, 200));
  });
  return {
    assertClean() {
      expect(errors, "unhandled console/page errors").toEqual([]);
    },
  };
}
