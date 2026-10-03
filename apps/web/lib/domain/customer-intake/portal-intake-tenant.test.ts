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

const stakeholderCtx = { ...memberCtx, role: "stakeholder" } as TenantContext;

function chain(result: { data: unknown }) {
  const q: Record<string, unknown> = {};
  q.select = () => q;
  q.eq = () => q;
  q.limit = () => q;
  q.maybeSingle = async () => result;
  return q;
}

describe("portal intake tenant resolution", () => {
  it("honors explicit tenant for mixed internal/stakeholder callers", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "tenants") return chain({ data: null });
        if (table === "tenant_members") return chain({ data: { id: "tm-b" } });
        return chain({ data: null });
      },
    };
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-stakeholder" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, memberCtx, req, null);
    expect(resolved).toEqual({ tenantId: "t-stakeholder" });
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

  it("accepts x-tenant-id when the caller has an active grant in that tenant", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "tenants") return chain({ data: null });
        if (table === "tenant_members") return chain({ data: { id: "tm1" } });
        return chain({ data: null });
      },
    };
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-explicit" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, null);
    expect(resolved).toEqual({ tenantId: "t-explicit" });
  });

  it("denies a tenant claim with no membership or grant", async () => {
    const supabase = {
      from: () => chain({ data: null }),
    };
    const req = new Request("https://test/api/v1/portal/intake", {
      method: "POST",
      headers: { "x-tenant-id": "t-foreign" },
    });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, null);
    expect(resolved).toMatchObject({ status: 403 });
  });

  it("resolves tenant from project_id when the caller can access that tenant", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "projects") return chain({ data: { id: "p1", tenant_id: "t-from-project" } });
        if (table === "tenants") return chain({ data: null });
        if (table === "tenant_members") return chain({ data: { id: "tm1" } });
        return chain({ data: null });
      },
    };
    const req = new Request("https://test/api/v1/portal/intake", { method: "POST" });
    const resolved = await resolvePortalIntakeTenant(supabase as never, stakeholderCtx, req, "p1");
    expect(resolved).toEqual({ tenantId: "t-from-project" });
  });
});
