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

  it("public marketing header exposes a locale switcher for en/ru/es/it", () => {
    expect(headerSrc).toContain("PublicLocaleSwitcher");
  });

  it("authenticated auth pages redirect via resolvePostAuthEntry without subscribe fallback", () => {
    expect(middlewareSrc).toContain("resolvePostAuthEntry({ locale, next, baseUrl: request.url })");
    expect(middlewareSrc).not.toContain("{ path: `/${locale}/subscribe`");
    expect(middlewareSrc).not.toContain("hasExplicitNext");
    const authIdx = middlewareSrc.indexOf("isAuthPage && user");
    expect(authIdx).toBeGreaterThanOrEqual(0);
    const authSlice = middlewareSrc.slice(authIdx, authIdx + 450);
    expect(authSlice).toContain("resolvePostAuthEntry");
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
    const subSrc = readFileSync(join(__dirname, "app/[locale]/(public)/subscribe/page.tsx"), "utf8");
    expect(subSrc).toContain("tenantId && hasDashboardAccess");
  });

  it("guest access to dashboard sends user to localized login preserving next path", () => {
    expect(middlewareSrc).toContain('loginUrl.searchParams.set("next", nextTarget)');
    expect(middlewareSrc).toContain("pathnameForLoc}${request.nextUrl.search}");
  });

  it("protected prefixes use segment matching so /projects-showcase stays public", () => {
    expect(middlewareSrc).toContain('from "@/lib/routing/matches-path-prefix"');
    expect(middlewareSrc).toContain("PROTECTED_PREFIXES.some((p) => matchesPathPrefix(pathWithoutLoc, p))");
    expect(middlewareSrc).not.toContain("PROTECTED_PREFIXES.some((p) => pathWithoutLoc.startsWith(p))");
  });

  it("forwards the URL locale so <html lang> is not stuck on ru", () => {
    expect(middlewareSrc).toContain('requestHeaders.set("x-next-intl-locale", localeFromPath)');
  });
});
