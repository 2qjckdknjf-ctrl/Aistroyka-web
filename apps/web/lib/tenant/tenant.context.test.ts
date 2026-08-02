import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_TENANT_HEADER } from "./active-tenant";
import { getTenantContextFromRequest } from "./tenant.context";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";

type Fixture = {
  ownedId: string | null;
  memberships: Array<{ tenant_id: string; role: string }>;
};

const mocks = vi.hoisted(() => {
  let fixture: Fixture = { ownedId: null, memberships: [] };

  function reset(next: Fixture) {
    fixture = next;
  }

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: vi.fn((table: string) => {
      const state: { filters: Record<string, string> } = { filters: {} };
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = (col: string, val: string) => {
        state.filters[col] = val;
        return chain;
      };
      chain.order = () => chain;
      chain.limit = () => chain;
      chain.maybeSingle = async () => {
        if (table === "tenants") {
          if (state.filters.id && state.filters.user_id) {
            const ok = fixture.ownedId === state.filters.id;
            return { data: ok ? { id: state.filters.id } : null, error: null };
          }
          if (state.filters.id && !state.filters.user_id) {
            // getRoleInTenant owner check: tenants by id → user_id
            const owned = fixture.ownedId === state.filters.id;
            return {
              data: owned ? { user_id: "user-1" } : { user_id: "other" },
              error: null,
            };
          }
          if (state.filters.user_id && !state.filters.id) {
            return {
              data: fixture.ownedId ? { id: fixture.ownedId } : null,
              error: null,
            };
          }
          return { data: null, error: null };
        }

        if (table === "tenant_members") {
          if (state.filters.tenant_id && state.filters.user_id) {
            const row = fixture.memberships.find((m) => m.tenant_id === state.filters.tenant_id);
            if (state.filters.user_id === "user-1" && row) {
              // Could be access check (select tenant_id) or role check (select role)
              return { data: { tenant_id: row.tenant_id, role: row.role }, error: null };
            }
            return { data: null, error: null };
          }
          if (state.filters.user_id && !state.filters.tenant_id) {
            if (fixture.memberships.length === 0) return { data: null, error: null };
            const sorted = [...fixture.memberships].sort((a, b) =>
              a.tenant_id.localeCompare(b.tenant_id)
            );
            return { data: { tenant_id: sorted[0]!.tenant_id }, error: null };
          }
        }

        throw new Error(`Unexpected table ${table}`);
      };
      return chain;
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

describe("getTenantContextFromRequest active tenant (2C / T-P2-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("accepts stakeholder tenant_members role as portal-only tenant context", async () => {
    mocks.reset({
      ownedId: null,
      memberships: [{ tenant_id: T1, role: "stakeholder" }],
    });
    const ctx = await getTenantContextFromRequest(
      new Request("https://test/api/v1/projects/p1/client-view")
    );
    expect(ctx).toMatchObject({
      tenantId: T1,
      userId: "user-1",
      role: "stakeholder",
    });
  });

  it("rejects unknown tenant_members roles as absent tenant context", async () => {
    mocks.reset({
      ownedId: null,
      memberships: [{ tenant_id: T1, role: "unknown" }],
    });
    const ctx = await getTenantContextFromRequest(
      new Request("https://test/api/v1/projects/p1/client-view")
    );
    expect(ctx).toMatchObject({
      tenantId: null,
      userId: "user-1",
      role: null,
    });
  });

  it("selects explicit authorized x-tenant-id over default membership order", async () => {
    mocks.reset({
      ownedId: null,
      memberships: [
        { tenant_id: T1, role: "member" },
        { tenant_id: T2, role: "admin" },
      ],
    });
    const ctx = await getTenantContextFromRequest(
      new Request("https://test/api/v1/projects", {
        headers: { [ACTIVE_TENANT_HEADER]: T2 },
      })
    );
    expect(ctx).toMatchObject({
      tenantId: T2,
      userId: "user-1",
      role: "admin",
    });
  });

  it("fail-closed on unauthorized x-tenant-id (no fallback to another tenant)", async () => {
    mocks.reset({
      ownedId: null,
      memberships: [{ tenant_id: T1, role: "member" }],
    });
    const ctx = await getTenantContextFromRequest(
      new Request("https://test/api/v1/projects", {
        headers: { [ACTIVE_TENANT_HEADER]: T2 },
      })
    );
    expect(ctx).toMatchObject({
      tenantId: null,
      userId: "user-1",
      role: null,
    });
  });

  it("fail-closed on unauthorized x-tenant-id even when a valid cookie is present", async () => {
    mocks.reset({
      ownedId: null,
      memberships: [{ tenant_id: T1, role: "member" }],
    });
    const ctx = await getTenantContextFromRequest(
      new Request("https://test/api/v1/projects", {
        headers: {
          [ACTIVE_TENANT_HEADER]: T2,
          cookie: `aistroyka_active_tenant=${T1}`,
        },
      })
    );
    expect(ctx).toMatchObject({
      tenantId: null,
      userId: "user-1",
      role: null,
    });
  });

  it("uses owned tenant when present without explicit header", async () => {
    mocks.reset({
      ownedId: T2,
      memberships: [{ tenant_id: T1, role: "member" }],
    });
    const ctx = await getTenantContextFromRequest(new Request("https://test/api/v1/projects"));
    expect(ctx).toMatchObject({
      tenantId: T2,
      userId: "user-1",
      role: "owner",
    });
  });
});
