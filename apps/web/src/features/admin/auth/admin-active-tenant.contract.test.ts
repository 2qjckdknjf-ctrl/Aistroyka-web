/**
 * Contract: tenant-admin server reads must attach an explicit active-tenant predicate.
 * Pure string/source checks — no live DB.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../../..");

function readApp(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin page active-tenant read scoping", () => {
  it("admin hub scopes analysis_jobs and ai_analysis to active tenant", () => {
    const src = readApp("app/[locale]/(dashboard)/admin/page.tsx");
    expect(src).toContain("resolveAdminPageTenantScope");
    expect(src).toContain('.eq("tenant_id", scope.tenantId)');
    expect(src).toMatch(/from\("analysis_jobs"\)[\s\S]*eq\("tenant_id"/);
    expect(src).toMatch(/from\("ai_analysis"\)[\s\S]*eq\("tenant_id"/);
  });

  it("system observability passes active tenant into getSystemMetrics", () => {
    const src = readApp("app/[locale]/(dashboard)/admin/system/page.tsx");
    expect(src).toContain("resolveAdminPageTenantScope");
    expect(src).toContain("getSystemMetrics(supabase, scope.tenantId)");
  });

  it("observability metrics helpers accept tenantId filter", () => {
    const src = readApp("lib/observability/metrics.ts");
    expect(src).toContain("tenantId?: string | null");
    expect(src).toContain('.eq("tenant_id", tenantId)');
  });

  it("admin layout uses requireAdmin with headers (active tenant)", () => {
    const src = readApp("app/[locale]/(dashboard)/admin/layout.tsx");
    expect(src).toContain("await headers()");
    expect(src).toContain("requireAdmin(supabase, headersList)");
    expect(src).toContain("redirect(`/${locale}/dashboard`)");
    // redirect must not sit inside a generic try/catch
    expect(src).not.toMatch(/try\s*\{[\s\S]*redirect\([\s\S]*\}\s*catch/);
  });

  it("dashboard layout aligns isAdmin and canManageTeam from requireAdmin", () => {
    const src = readApp("app/[locale]/(dashboard)/layout.tsx");
    expect(src).toContain("requireAdmin(supabase, headersList)");
    expect(src).toContain("canManageTeam = adminResult.allowed");
    expect(src).toContain("isAdmin = adminResult.allowed");
  });

  it("AI overview locks client to activeTenantId prop", () => {
    const page = readApp("app/[locale]/(dashboard)/admin/ai/page.tsx");
    const client = readApp("app/[locale]/(dashboard)/admin/ai/AdminAiOverviewClient.tsx");
    expect(page).toContain("activeTenantId={scope.tenantId}");
    expect(client).toContain("activeTenantId");
    expect(client).not.toContain("useAdminTenants");
  });
});

describe("platform-owner legacy admin redirects", () => {
  it("leads/billing-pilot pages redirect to platform-admin", () => {
    const leads = readApp("app/[locale]/(dashboard)/admin/leads/page.tsx");
    const billing = readApp("app/[locale]/(dashboard)/admin/billing-pilot/page.tsx");
    expect(leads).toContain("PLATFORM_ADMIN_BASE_PATH");
    expect(leads).toMatch(/\/leads/);
    expect(billing).toContain("PLATFORM_ADMIN_BASE_PATH");
    expect(billing).toMatch(/\/billing/);
  });

  it("nested layouts require platform_owner_grants before children", () => {
    const leadsLayout = readApp("app/[locale]/(dashboard)/admin/leads/layout.tsx");
    const billingLayout = readApp("app/[locale]/(dashboard)/admin/billing-pilot/layout.tsx");
    expect(leadsLayout).toContain("assertPlatformOwnerLegacyAdminPageAccess");
    expect(billingLayout).toContain("assertPlatformOwnerLegacyAdminPageAccess");
  });

  it("legacy gate redirects tenant admins to /admin and unauth to dashboard", () => {
    const gate = readApp("lib/platform-owner/require-platform-owner-legacy-admin-page.ts");
    expect(gate).toContain("getPlatformOwnerGrant");
    expect(gate).toContain("`/${locale}/dashboard`");
    expect(gate).toContain("`/${locale}/admin`");
  });
});

describe("admin layout locale + redirect contract", () => {
  it("preserves locale from x-next-intl-locale", () => {
    const src = readApp("app/[locale]/(dashboard)/admin/layout.tsx");
    expect(src).toContain('headersList.get("x-next-intl-locale")');
    expect(src).toContain("routing.defaultLocale");
  });
});
