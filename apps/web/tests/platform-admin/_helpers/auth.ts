import { expect, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { loginViaApi } from "../../e2e/_helpers/auth";

export type PlatformOwnerCredentials = {
  email: string;
  password: string;
};

export type PlatformAdminGateSkip =
  | { ok: true; creds: PlatformOwnerCredentials }
  | { ok: false; reason: string; attachName?: string; attachBody?: string };

export function resolvePlatformOwnerCredentials(): PlatformOwnerCredentials | null {
  const email =
    process.env.ROMA_PLATFORM_OWNER_EMAIL ??
    process.env.QA_PLATFORM_OWNER_EMAIL ??
    process.env.PLATFORM_OWNER_EMAIL;
  const password =
    process.env.ROMA_PLATFORM_OWNER_PASSWORD ??
    process.env.QA_PLATFORM_OWNER_PASSWORD ??
    process.env.PLATFORM_OWNER_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function resolveCloudflareAccessHeaders(): Record<string, string> | undefined {
  const clientId = process.env.CF_ACCESS_CLIENT_ID;
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return undefined;
  return {
    "CF-Access-Client-Id": clientId,
    "CF-Access-Client-Secret": clientSecret,
  };
}

export function evaluatePlatformAdminGate(baseURL: string | undefined): PlatformAdminGateSkip {
  if (!baseURL) {
    return { ok: false, reason: "PLAYWRIGHT_BASE_URL required for Operations Center E2E." };
  }

  if (process.env.CI && process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1" && /localhost|127\.0\.0\.1/i.test(baseURL)) {
    return {
      ok: false,
      reason: "ROMA_E2E_BASE_URL (remote) required for CI Playwright when PLAYWRIGHT_SKIP_WEB_SERVER=1.",
      attachName: "skip-ci-no-remote-base-url",
      attachBody:
        "CI does not start a local dev server for Operations Center tests. Configure ROMA_E2E_BASE_URL " +
        "(e.g. staging) plus ROMA_PLATFORM_OWNER_* secrets to execute live golden path, axe, and visual suites.",
    };
  }

  const creds = resolvePlatformOwnerCredentials();
  if (!creds) {
    return {
      ok: false,
      reason:
        "Set ROMA_PLATFORM_OWNER_EMAIL/PASSWORD or QA_PLATFORM_OWNER_* for Operations Center golden path.",
      attachName: "skip-missing-platform-owner-credentials",
      attachBody:
        "No production credentials are stored in-repo. Provide ROMA_PLATFORM_OWNER_EMAIL and " +
        "ROMA_PLATFORM_OWNER_PASSWORD via CI secrets or local env to run authenticated Operations Center tests.",
    };
  }

  if (/admin\.aistroyka\.ai/i.test(baseURL) && !resolveCloudflareAccessHeaders()) {
    return {
      ok: false,
      reason: "Cloudflare Access service token required for admin.aistroyka.ai automation.",
      attachName: "skip-cloudflare-access",
      attachBody:
        "admin.aistroyka.ai is protected by Cloudflare Access. Set CF_ACCESS_CLIENT_ID and " +
        "CF_ACCESS_CLIENT_SECRET (service token) or run against local/staging without Access.",
    };
  }

  return { ok: true, creds };
}

export async function attachSkipReason(testInfo: TestInfo, gate: PlatformAdminGateSkip): Promise<void> {
  if (gate.ok) return;
  if (gate.attachName && gate.attachBody) {
    await testInfo.attach(gate.attachName, {
      body: gate.attachBody,
      contentType: "text/plain",
    });
  }
}

export async function loginPlatformOwner(context: BrowserContext, baseURL: string): Promise<void> {
  const gate = evaluatePlatformAdminGate(baseURL);
  if (!gate.ok) {
    throw new Error(gate.reason);
  }
  await loginViaApi(context, baseURL, gate.creds.email, gate.creds.password);
}

export async function assertPlatformOwnerSurface(page: Page, testInfo: TestInfo): Promise<boolean> {
  if (page.url().includes("/login")) {
    await testInfo.attach("skip-platform-owner-grant", {
      body:
        "Supabase login succeeded but user was redirected to login when opening Operations Center. " +
        "Provision platform_owner_grants for the authenticated user.",
      contentType: "text/plain",
    });
    return false;
  }

  const bodyText = (await page.locator("body").textContent()) ?? "";
  if (bodyText.includes("403") || /access denied|forbidden/i.test(bodyText)) {
    await testInfo.attach("skip-platform-owner-grant", {
      body: "Authenticated user lacks platform_owner_grants row or Cloudflare Access policy block.",
      contentType: "text/plain",
    });
    return false;
  }

  return true;
}

export async function openOperationsCenterPage(
  page: Page,
  baseURL: string,
  routePath: string,
  testInfo: TestInfo
): Promise<boolean> {
  const headers = resolveCloudflareAccessHeaders();
  if (headers) {
    await page.context().setExtraHTTPHeaders(headers);
  }

  await page.goto(`${baseURL.replace(/\/$/, "")}/${process.env.E2E_LOCALE ?? "en"}${routePath}`, {
    waitUntil: "domcontentloaded",
  });

  return assertPlatformOwnerSurface(page, testInfo);
}

export async function expectOperationsCenterReady(page: Page): Promise<void> {
  await expect(page.locator("nav[aria-label='Operations Center navigation']")).toBeVisible();
  await expect(page.locator("main, [role='main']").first()).toBeVisible();
}
