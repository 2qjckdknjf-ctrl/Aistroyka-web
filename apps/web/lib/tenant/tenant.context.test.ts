import { describe, expect, it, vi } from "vitest";
import { getTenantContextFromRequest } from "./tenant.context";

type MemberRow = { tenant_id: string; role: string };

const mocks = vi.hoisted(() => {
  let tenantsCalls = 0;
  let tenantMembersCalls = 0;
  let memberRows: MemberRow[] = [{ tenant_id: "tenant-1", role: "stakeholder" }];

  function reset(roleOrRows: string | MemberRow[] = "stakeholder") {
    tenantsCalls = 0;
    tenantMembersCalls = 0;
    memberRows =
      typeof roleOrRows === "string"
        ? [{ tenant_id: "tenant-1", role: roleOrRows }]
        : roleOrRows;
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
        const call = tenantMembersCalls;
        let scopedTenantId: string | null = null;
        const tenantMembersQuery: {
          select: ReturnType<typeof vi.fn>;
          eq: ReturnType<typeof vi.fn>;
          limit: ReturnType<typeof vi.fn>;
          maybeSingle: ReturnType<typeof vi.fn>;
          then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => Promise<unknown>;
        } = {
          select: vi.fn(() => tenantMembersQuery),
          eq: vi.fn((column: string, value: string) => {
            if (column === "tenant_id") scopedTenantId = value;
            return tenantMembersQuery;
          }),
          limit: vi.fn(() => tenantMembersQuery),
          maybeSingle: vi.fn().mockImplementation(async () => {
            const row =
              (scopedTenantId ? memberRows.find((r) => r.tenant_id === scopedTenantId) : null) ??
              memberRows[0] ?? { tenant_id: "tenant-1", role: "unknown" };
            return { data: call === 1 ? row : { role: row.role } };
          }),
          then: (onFulfilled, onRejected) =>
            Promise.resolve({
              data: call === 1 ? memberRows : { role: memberRows[0]?.role },
              error: null,
            }).then(onFulfilled, onRejected),
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

  it("uses the contractor workspace when the user is also a stakeholder elsewhere", async () => {
    mocks.reset([
      { tenant_id: "portal-tenant", role: "stakeholder" },
      { tenant_id: "ops-tenant", role: "member" },
    ]);

    const ctx = await getTenantContextFromRequest(new Request("https://test/api/v1/projects"));

    expect(ctx).toMatchObject({
      tenantId: "ops-tenant",
      userId: "user-1",
      role: "member",
    });
  });
});
