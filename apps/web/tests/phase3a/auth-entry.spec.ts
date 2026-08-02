import { expect, test } from "@playwright/test";
import { LOCALES, localePath } from "./constants";

async function typeControlled(
  input: import("@playwright/test").Locator,
  value: string,
) {
  await input.click();
  await input.fill("");
  await input.pressSequentially(value, { delay: 8 });
  // Controlled React inputs can drop the first sequential type under load — retry once.
  if ((await input.inputValue()) !== value) {
    await input.fill("");
    await input.pressSequentially(value, { delay: 12 });
  }
  await expect(input).toHaveValue(value, { timeout: 10_000 });
}

async function submitEmailLogin(page: import("@playwright/test").Page, email: string, password: string) {
  await expect(page.locator("#email-login-form")).toBeVisible();
  await expect(
    page.getByText(/Supabase env missing/i),
    "NEXT_PUBLIC_SUPABASE_* must be available to the Phase 3A webServer",
  ).toHaveCount(0);

  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  await typeControlled(emailInput, email);
  await typeControlled(passwordInput, password);

  const submit = page.getByRole("button", { name: /sign in|войти|accedi|iniciar/i });
  await expect(submit).toBeEnabled({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/api/v1/auth/login") && r.request().method() === "POST",
    { timeout: 30_000 },
  );
  await submit.click();
  return responsePromise;
}

function isExternalEvil(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "evil.com" || u.hostname.endsWith(".evil.com");
  } catch {
    return false;
  }
}

async function installHrefProbe(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __phase3aHrefs: string[] };
    w.__phase3aHrefs = [];
    const desc = Object.getOwnPropertyDescriptor(Location.prototype, "href");
    if (!desc?.set || (Location.prototype as Location & { __phase3a?: boolean }).__phase3a) return;
    (Location.prototype as Location & { __phase3a?: boolean }).__phase3a = true;
    Object.defineProperty(Location.prototype, "href", {
      configurable: true,
      enumerable: true,
      get: desc.get,
      set(v: string) {
        w.__phase3aHrefs.push(String(v));
        desc.set!.call(this, v);
      },
    });
  });
}

async function readHrefProbe(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __phase3aHrefs?: string[] }).__phase3aHrefs ?? []);
}

test.describe("Phase 3A — authentication entry (credential-free)", () => {
  for (const locale of LOCALES) {
    test(`${locale} login form usable email/password controls`, async ({ page }) => {
      await page.goto(localePath(locale, "/login"), { waitUntil: "domcontentloaded" });
      const email = page.locator('#email-login-form input[type="email"], #email-login-form input[name="email"]');
      const password = page.locator('#email-login-form input[type="password"]');
      await expect(email).toBeVisible();
      await expect(password).toBeVisible();
      await expect(page.locator('#email-login-form button[type="submit"]')).toBeVisible();

      const emailId = await email.getAttribute("id");
      const hasAria = Boolean(await email.getAttribute("aria-label"));
      const hasLabel = emailId ? (await page.locator(`label[for="${emailId}"]`).count()) > 0 : false;
      expect(hasAria || hasLabel).toBeTruthy();
    });

    test(`${locale} register entry reachable + locale preserved with login`, async ({ page }) => {
      await page.goto(localePath(locale, "/login"), { waitUntil: "domcontentloaded" });
      await page.locator(`a[href*="register"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/register`));
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await page.locator(`a[href*="login"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
    });
  }

  test("invalid login stays on auth surface with accessible error", async ({ page }) => {
    await page.goto(localePath("en", "/login"), { waitUntil: "domcontentloaded" });
    const res = await submitEmailLogin(
      page,
      "phase3a-invalid@example.com",
      "definitely-wrong-password-phase3a",
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);

    await expect(page).toHaveURL(/\/en\/login/);
    const alert = page.locator('[role="alert"]').filter({ hasText: /\S+/ });
    await expect(alert.first()).toBeVisible({ timeout: 10_000 });
    expect(page.url()).not.toMatch(/\/dashboard|\/subscribe|\/checkout/);
    await expect(page.getByText(/Login step:\s*error/i)).toBeVisible();
  });

  test("open redirect blocked: //evil.com next → safe internal after mocked success", async ({ page }) => {
    await installHrefProbe(page);
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(localePath("en", "/login") + "?next=" + encodeURIComponent("//evil.com"), {
      waitUntil: "domcontentloaded",
    });

    // OAuth/Telegram next must already be sanitized on the entry surface.
    const telegram = page.locator('a[href*="/telegram/start"]');
    await expect(telegram).toBeVisible();
    const telegramHref = await telegram.getAttribute("href");
    expect(telegramHref).not.toMatch(/evil\.com/i);
    expect(telegramHref).toMatch(/next=%2Fen%2Fdashboard|next=.*dashboard/);

    await submitEmailLogin(page, "mock@example.com", "mock-password-not-sent-live");

    await expect
      .poll(async () => {
        const hrefs = await readHrefProbe(page).catch(() => [] as string[]);
        const url = page.url();
        const next = (() => {
          try {
            return new URL(url).searchParams.get("next") ?? "";
          } catch {
            return "";
          }
        })();
        return (
          hrefs.some((h) => h.includes("/en/dashboard") && !/evil\.com/i.test(h)) ||
          (url.includes("/en/login") && next.includes("/dashboard") && !/evil\.com/i.test(next)) ||
          url.includes("/en/dashboard")
        );
      }, { timeout: 20_000 })
      .toBeTruthy();

    expect(isExternalEvil(page.url())).toBe(false);
  });

  test("safe internal next preserved after mocked success", async ({ page }) => {
    await installHrefProbe(page);
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const next = "/en/dashboard/projects";
    await page.goto(localePath("en", "/login") + `?next=${encodeURIComponent(next)}`, {
      waitUntil: "domcontentloaded",
    });
    await submitEmailLogin(page, "mock@example.com", "mock-password");

    await expect
      .poll(async () => {
        const hrefs = await readHrefProbe(page).catch(() => [] as string[]);
        const url = page.url();
        const nextParam = (() => {
          try {
            return new URL(url).searchParams.get("next") ?? "";
          } catch {
            return "";
          }
        })();
        return (
          hrefs.some((h) => h.includes("/en/dashboard/projects")) ||
          url.includes("/en/dashboard/projects") ||
          nextParam.includes("/dashboard/projects")
        );
      }, { timeout: 20_000 })
      .toBeTruthy();
    expect(isExternalEvil(page.url())).toBe(false);
  });

  test("unauthenticated dashboard navigation returns to login without looping", async ({ page }) => {
    await page.goto(localePath("es", "/dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/es\/login/);
    await page.goto(localePath("es", "/dashboard/projects"), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/es\/login/);
    expect(page.url()).not.toMatch(/subscribe/);
  });
});
