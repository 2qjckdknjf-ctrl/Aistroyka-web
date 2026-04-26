import { expect, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { e2eLocale } from "./routes";

function cookieHeaderFromSetCookie(setCookie: string | null): { name: string; value: string; domain: string; path: string }[] {
  if (!setCookie) return [];
  const parts = setCookie.split(/,(?=[^;]+=)/).map((c) => c.trim());
  const out: { name: string; value: string; domain: string; path: string }[] = [];
  for (const part of parts) {
    const [nv, ...attrs] = part.split(";").map((s) => s.trim());
    const eq = nv.indexOf("=");
    if (eq < 0) continue;
    const name = nv.slice(0, eq);
    const value = nv.slice(eq + 1);
    let domain = "localhost";
    let cookiePath = "/";
    for (const a of attrs) {
      const [k, v] = a.split("=").map((s) => s.trim());
      if (k.toLowerCase() === "domain" && v) domain = v.replace(/^\./, "");
      if (k.toLowerCase() === "path" && v) cookiePath = v;
    }
    out.push({ name, value, domain, path: cookiePath });
  }
  return out;
}

export async function loginViaApi(context: BrowserContext, baseURL: string, email: string, password: string) {
  const res = await context.request.post(`${baseURL}/api/auth/login`, {
    data: { email, password, traceId: `e2e-${Date.now()}` },
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => "");
    throw new Error(`loginViaApi failed: ${res.status()} ${body.slice(0, 400)}`);
  }
  const rawSetCookie = res.headers()["set-cookie"];
  const cookies = cookieHeaderFromSetCookie(rawSetCookie ?? null);
  if (cookies.length) {
    const url = new URL(baseURL);
    await context.addCookies(
      cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || url.hostname,
        path: c.path || "/",
        url: baseURL,
      }))
    );
  }
  const page = await context.newPage();
  await page.goto(`${baseURL}/${e2eLocale}/dashboard`);
  await expect(page).toHaveURL(new RegExp(`/${e2eLocale}/dashboard`));
  await page.close();
}

export function requireE2eCredentials(): { email: string; password: string } {
  const email = process.env.E2E_EMAIL || process.env.E2E_USER_EMAIL || process.env.SMOKE_EMAIL;
  const password = process.env.E2E_PASSWORD || process.env.E2E_USER_PASSWORD || process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD (or E2E_USER_EMAIL / E2E_USER_PASSWORD) for authenticated E2E.");
  }
  return { email, password };
}

export async function loginApiRequest(request: APIRequestContext, baseURL: string, email: string, password: string) {
  const res = await request.post(`${baseURL}/api/auth/login`, {
    data: { email, password, traceId: `e2e-api-${Date.now()}` },
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => "");
    throw new Error(`loginApiRequest failed: ${res.status()} ${body.slice(0, 400)}`);
  }
}
