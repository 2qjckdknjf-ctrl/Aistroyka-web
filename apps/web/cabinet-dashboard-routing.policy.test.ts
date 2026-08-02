import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Cabinet visibility / dashboard stability policy (source asserts)", () => {
  const middlewareSrc = readFileSync(join(__dirname, "middleware.ts"), "utf8");
  const headerSrc = readFileSync(join(__dirname, "components/public/PublicHeader.tsx"), "utf8");

  it("PublicHeader includes explicit /dashboard cabinet CTA (desktop + mobile)", () => {
    expect(headerSrc).toContain('href="/dashboard"');
    expect(headerSrc).toContain('t("cabinet")');
  });

  it("authenticated auth pages redirect via resolvePostAuthEntry without subscribe fallback", () => {
    expect(middlewareSrc).toContain("resolvePostAuthEntry({");
    expect(middlewareSrc).toContain("activeRole");
    expect(middlewareSrc).not.toContain("{ path: `/${locale}/subscribe`");
    expect(middlewareSrc).not.toContain("hasExplicitNext");
    const authIdx = middlewareSrc.indexOf("isAuthPage && user");
    expect(authIdx).toBeGreaterThanOrEqual(0);
    const authSlice = middlewareSrc.slice(authIdx, authIdx + 900);
    expect(authSlice).toContain("resolvePostAuthEntry");
    expect(authSlice).toContain("activeRole");
    expect(authSlice).not.toContain("/subscribe");
  });

  it("sets X-Auth-Redirect post-auth-entry for authenticated login/register handling", () => {
    expect(middlewareSrc).toContain('headers.set("X-Auth-Redirect", "post-auth-entry")');
  });

  it("dashboard layout gate uses hasDashboardAccess (pilot / subscription merge)", () => {
    const layoutSrc = readFileSync(join(__dirname, "app/[locale]/(dashboard)/layout.tsx"), "utf8");
    expect(layoutSrc).toContain("!subscriptionState.hasDashboardAccess");
  });

  it("subscribe page redirects dashboard-eligible users (subscription or pilot cohort)", () => {
    const subSrc = readFileSync(join(__dirname, "app/[locale]/subscribe/page.tsx"), "utf8");
    expect(subSrc).toContain("tenantId && hasDashboardAccess");
  });

  it("guest access to dashboard sends user to localized login preserving next path", () => {
    expect(middlewareSrc).toContain('loginUrl.searchParams.set("next", pathnameForLoc)');
  });
});
