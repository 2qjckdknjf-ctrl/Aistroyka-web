import { describe, expect, it, vi } from "vitest";
import { getTenantContextFromRequest } from "./tenant.context";

const mocks = vi.hoisted(() => {
  let tenantsCalls = 0;
  let tenantMembersCalls = 0;
  let memberRole = "stakeholder";

  function reset(role = "stakeholder") {
    tenantsCalls = 0;
    tenantMembersCalls = 0;
    memberRole = role;
  }

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: vi.fn((table: string) => {
      if (table === "tenants") {
        tenantsCalls += 1;
        const result = tenantsCalls === 1 ? { data: null } : { data: { user_id: "other-user" } };
        const tenantsQuery = {
          select: vi.fn(() => tenantsQuery),
          eq: vi.fn(() => tenantsQuery),
          maybeSingle: vi.fn().mockResolvedValue(result),
        };
        return tenantsQuery;
      }

      if (table === "tenant_members") {
        tenantMembersCalls += 1;
        const result =
          tenantMembersCalls === 1
            ? { data: { tenant_id: "tenant-1" } }
            : { data: { role: memberRole } };
        const tenantMembersQuery = {
          select: vi.fn(() => tenantMembersQuery),
          eq: vi.fn(() => tenantMembersQuery),
          limit: vi.fn(() => tenantMembersQuery),
          maybeSingle: vi.fn().mockResolvedValue(result),
        };
        return tenantMembersQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { reset, supabase };
});

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue(mocks.supabase),
  createClient: vi.fn(),
  ServiceRoleForbiddenError: class ServiceRoleForbiddenError extends Error {},
}));

vi.mock("@/lib/authz/authz.service", () => ({
  getPermissionsForContext: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock("@/lib/authz/authz.repository", () => ({
  getUserScopes: vi.fn().mockResolvedValue([]),
}));

describe("getTenantContextFromRequest", () => {
  it("accepts stakeholder tenant_members role as portal-only tenant context", async () => {
    mocks.reset("stakeholder");
    const ctx = await getTenantContextFromRequest(new Request("https://test/api/v1/projects/p1/client-view"));

    expect(ctx).toMatchObject({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "stakeholder",
    });
  });

  it("rejects unknown tenant_members roles as absent tenant context", async () => {
    mocks.reset("unknown");

    const ctx = await getTenantContextFromRequest(new Request("https://test/api/v1/projects/p1/client-view"));

    expect(ctx).toMatchObject({
      tenantId: null,
      userId: "user-1",
      role: null,
    });
  });
});
