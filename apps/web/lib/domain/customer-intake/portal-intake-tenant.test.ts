import { describe, expect, it } from "vitest";
import { readExplicitTenantClaim, resolvePortalIntakeTenant } from "./portal-intake-tenant";
import type { TenantContext } from "@/lib/tenant/tenant.types";

const memberCtx = {
  tenantId: "t-primary",
  userId: "u1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "web",
  traceId: "tr",
} as TenantContext;

const viewerCtx = { ...memberCtx, role: "viewer" } as TenantContext;
const stakeholderCtx = { ...memberCtx, role: "stakeholder" } as TenantContext;

function chain(result: { data: unknown }) {
  const q: Record<string, unknown> = {};
  q.select = () => q;
  q.eq = () => q;
  q.limit = () => q;
  q.maybeSingle = async () => result;
  return q;
}

function supabaseFrom(map: Record<string, { data: unknown }>) {
  return {
    from: (table: string) => chain(map[table] ?? { data: null }),
  };
}

describe("portal intake tenant resolution", () => {
  it("1. internal member + explicit tenant is allowed", async () => {
    const supabase = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm1", role: "member" } },
    });
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-explicit" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, memberCtx, req, null);
    expect(resolved).toEqual({ tenantId: "t-explicit" });
  });

  it("2. viewer + allowed read path is allowed", async () => {
    const supabase = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tmv", role: "viewer" } },
    });
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "GET",
      headers: { "x-tenant-id": "t-explicit" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, viewerCtx, req, null);
    expect(resolved).toEqual({ tenantId: "t-explicit" });
  });

  it("3. stakeholder + active portal grant is allowed", async () => {
    const supabase = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm-stale", role: "stakeholder" } },
      project_stakeholders: { data: { id: "ps1" } },
    });
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-explicit" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, null);
    expect(resolved).toEqual({ tenantId: "t-explicit" });
  });

  it("4. stakeholder + revoked grant is denied", async () => {
    const supabase = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm-stale", role: "stakeholder" } },
      project_stakeholders: { data: null },
    });
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-explicit" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, null);
    expect(resolved).toMatchObject({ status: 403 });
  });

  it("5. stale stakeholder tenant_members row alone is denied", async () => {
    const supabase = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm-stale", role: "stakeholder" } },
    });
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-explicit" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, null);
    expect(resolved).toMatchObject({ status: 403 });
  });

  it("6. mixed-role user uses membership for internal tenant and grant for portal tenant", async () => {
    const memberTenant = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm-a", role: "member" } },
    });
    const portalTenant = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm-b", role: "stakeholder" } },
      project_stakeholders: { data: { id: "ps-b" } },
    });
    const revokedPortal = supabaseFrom({
      tenants: { data: null },
      tenant_members: { data: { id: "tm-b", role: "stakeholder" } },
      project_stakeholders: { data: null },
    });
    const memberReq = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-a" },
    });
    const portalReq = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-b" },
    });
    expect(await resolvePortalIntakeTenant(memberTenant as never, memberCtx, memberReq, null)).toEqual({
      tenantId: "t-a",
    });
    expect(await resolvePortalIntakeTenant(portalTenant as never, memberCtx, portalReq, null)).toEqual({
      tenantId: "t-b",
    });
    expect(await resolvePortalIntakeTenant(revokedPortal as never, memberCtx, portalReq, null)).toMatchObject({
      status: 403,
    });
  });

  it("keeps internal tenant context without requiring a header", async () => {
    const req = new Request("https://test/api/v1/portal/intake", { method: "POST" });
    const resolved = await resolvePortalIntakeTenant({} as never, memberCtx, req, null);
    expect(resolved).toEqual({ tenantId: "t-primary" });
  });

  it("requires x-tenant-id or project_id for projectless stakeholder intake", async () => {
    const req = new Request("https://test/api/v1/portal/intake", { method: "POST" });
    const resolved = await resolvePortalIntakeTenant({} as never, stakeholderCtx, req, null);
    expect(resolved).toMatchObject({ status: 400 });
    if ("error" in resolved) expect(resolved.error).toMatch(/x-tenant-id or project_id/);
  });

  it("treats an empty x-tenant-id header as present and invalid", async () => {
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "   " },
    });
    expect(readExplicitTenantClaim(req)).toEqual({ present: true, value: "" });
    const resolved = await resolvePortalIntakeTenant({} as never, stakeholderCtx, req, null);
    expect(resolved).toMatchObject({ status: 400 });
  });

  it("resolves tenant from project_id when the caller has an active grant", async () => {
    const supabase = supabaseFrom({
      projects: { data: { id: "p1", tenant_id: "t-from-project" } },
      tenants: { data: null },
      tenant_members: { data: { id: "tm1", role: "stakeholder" } },
      project_stakeholders: { data: { id: "ps1" } },
    });
    const req = new Request("https://test/api/v1/portal/intake", { method: "POST" });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, "p1");
    expect(resolved).toEqual({ tenantId: "t-from-project" });
  });
});
