import { expect, type Page, type Response, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const auditLocale = process.env.E2E_LOCALE || "en";
export const auditArtifactDir = process.env.AUDIT_ARTIFACT_DIR || path.join(process.cwd(), "../../docs/audit/artifacts/local");

/** Locale segment from `/xx/dashboard`-style URLs (when session prefs override E2E_LOCALE). */
export function localeFromDashboardUrl(url: string): string | undefined {
  const m = url.match(/\/(en|ru|es|it)\/(?:dashboard|admin)(?:\/|$|\?|#)/);
  return m?.[1];
}

export type NetworkIssue = {
  url: string;
  method: string;
  status: number;
};

export function formatNetworkIssue(i: NetworkIssue): string {
  return `${i.method} ${i.status} ${i.url}`;
}

/** Unauthenticated flow: middleware may send `/xx`, `/xx/`, or `/xx/login?next=...`. */
export function expectLocaleLandingOrLoginUrl(url: string) {
  expect(
    /\/(en|ru|es|it)\/?(?:\?.*)?$/i.test(url) || /\/(en|ru|es|it)\/login(?:\?.*)?$/i.test(url),
    `Expected locale root or sign-in URL, got: ${url}`,
  ).toBe(true);
}

/** One listener bound to `page`; call {@link #drain} between steps to isolate failures. */
export function attachApiIssueTracking(page: Page) {
  const issues: NetworkIssue[] = [];
  const onResponse = (response: Response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    if (url.includes("/api/health")) return;
    const status = response.status();
    if (status < 400) return;
    // No service role in .env.local → devices list returns 503; do not fail the nav audit for that alone.
    if (status === 503 && url.includes("/api/v1/devices")) return;
    // Help assistant metrics can 401 if requested before tenant context is attached (client race); not a nav failure.
    if (status === 401 && url.includes("/api/v1/help/assistant/metrics")) return;
    issues.push({
      url,
      method: response.request().method(),
      status,
    });
  };
  page.on("response", onResponse);
  return {
    drain(): NetworkIssue[] {
      const out = [...issues];
      issues.length = 0;
      return out;
    },
    detach() {
      page.off("response", onResponse);
    },
  };
}

export function attachConsoleErrorTracking(page: Page) {
  const errors: string[] = [];
  const shouldIgnore = (text: string) =>
    text.includes("[login]") ||
    text.includes("favicon") ||
    (text.includes("unsafe-eval") && text.includes("Content Security Policy")) ||
    (text.includes("Failed to load resource") && /\b404\b/.test(text)) ||
    // Chromium logs XHR failures; optional admin APIs can 401 briefly (role/session overlap) — not a nav bug.
    (text.includes("Failed to load resource") &&
      /\b401\b/.test(text) &&
      text.includes("Unauthorized"));

  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (shouldIgnore(text)) return;
    errors.push(text);
  };

  const onPageError = (error: Error) => {
    if (shouldIgnore(error.message)) return;
    errors.push(error.message);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  return {
    drain(): string[] {
      const out = [...errors];
      errors.length = 0;
      return out;
    },
    detach() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}

/**
 * Signs in via `/api/auth/login` when credentials are configured.
 * Returns `false` when `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` (or `SMOKE_*`) are absent.
 */
export async function loginIfConfigured(page: Page): Promise<boolean> {
  const email = process.env.E2E_USER_EMAIL || process.env.SMOKE_EMAIL;
  const password = process.env.E2E_USER_PASSWORD || process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    return false;
  }

  const loginResponse = await page.request.post("/api/auth/login", {
    data: {
      email,
      password,
      traceId: `e2e-${Date.now()}`,
    },
  });
  if (!loginResponse.ok()) {
    const body = await loginResponse.text().catch(() => "");
    throw new Error(`Login failed: status=${loginResponse.status()} body=${body.slice(0, 300)}`);
  }
  await page.goto(`/${auditLocale}/dashboard`);
  await page.waitForURL(/\/(en|ru|es|it)\/dashboard/, { timeout: 30_000 });
  await page.evaluate(() => {
    try {
      localStorage.setItem("aistroyka:first-launch-guide:v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/(en|ru|es|it)\/dashboard/, { timeout: 30_000 });
  return true;
}

export async function attachJson(testInfo: TestInfo, name: string, value: unknown) {
  const filePath = path.join(auditArtifactDir, `${testInfo.title.replace(/[^a-z0-9]+/gi, "_")}.${name}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  await testInfo.attach(name, {
    path: filePath,
    contentType: "application/json",
  });
}
