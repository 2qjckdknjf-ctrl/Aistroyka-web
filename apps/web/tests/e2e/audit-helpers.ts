import { expect, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const auditLocale = process.env.E2E_LOCALE || "ru";
export const auditArtifactDir = process.env.AUDIT_ARTIFACT_DIR || path.join(process.cwd(), "../../docs/audit/artifacts/local");

export type NetworkIssue = {
  url: string;
  method: string;
  status: number;
};

export function collectCriticalIssues(page: Page) {
  const issues: NetworkIssue[] = [];
  page.on("response", (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    if (url.includes("/api/health")) return;
    if (response.status() < 400) return;
    issues.push({
      url,
      method: response.request().method(),
      status: response.status(),
    });
  });
  return issues;
}

export function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  const shouldIgnore = (text: string) =>
    text.includes("[login]") ||
    text.includes("favicon") ||
    (text.includes("unsafe-eval") && text.includes("Content Security Policy"));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (shouldIgnore(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => {
    if (shouldIgnore(error.message)) return;
    errors.push(error.message);
  });
  return errors;
}

export async function loginIfConfigured(page: Page) {
  const email = process.env.E2E_USER_EMAIL || process.env.SMOKE_EMAIL;
  const password = process.env.E2E_USER_PASSWORD || process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    testSkipWithoutAuth();
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
  await page.waitForURL(new RegExp(`/${auditLocale}/dashboard`), { timeout: 30_000 });
  await expect(page).toHaveURL(new RegExp(`/${auditLocale}/dashboard`), { timeout: 30_000 });
}

function testSkipWithoutAuth(): never {
  throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD are required for authenticated E2E audit");
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
