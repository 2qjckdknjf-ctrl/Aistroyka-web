/**
 * Phase 3B — active-tenant tenant-admin UI gate contract tests.
 * Mocks Supabase + resolver helpers; never hits a live database.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveTenantForCurrentUser = vi.fn();
const hasMinRole = vi.fn();

vi.mock("@/lib/api/engine", () => ({
  resolveTenantForCurrentUser: (...args: unknown[]) => resolveTenantForCurrentUser(...args),
}));

vi.mock("@/lib/tenant/tenant-membership.server", () => ({
  hasMinRole: (...args: unknown[]) => hasMinRole(...args),
}));

import { requireAdmin } from "./requireAdmin";
import type { SupabaseClient } from "@supabase/supabase-js";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const USER_ID = "user-1";

function mockSupabase(memberships: Array<{ tenant_id: string; role: string }>) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: memberships, error: null }),
    })),
  } as unknown as SupabaseClient;
}

function headersWithTenant(tenantId: string): Headers {
  return new Headers({ "x-tenant-id": tenantId });
}

describe("requireAdmin (active-tenant scoped UI gate)", () => {
  beforeEach(() => {
    resolveTenantForCurrentUser.mockReset();
    hasMinRole.mockReset();
  });

  it("allows active-tenant owner/admin", async () => {
    const supabase = mockSupabase([
      { tenant_id: TENANT_A, role: "admin" },
      { tenant_id: TENANT_B, role: "member" },
    ]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: TENANT_A,
      source: "header",
      explicitRejected: false,
      queryError: false,
    });
    hasMinRole.mockResolvedValue(true);

    const result = await requireAdmin(supabase, headersWithTenant(TENANT_A));
    expect(result.allowed).toBe(true);
    expect(result.tenantId).toBe(TENANT_A);
    expect(result.blocked).toBe(false);
    expect(hasMinRole).toHaveBeenCalledWith(supabase, TENANT_A, "admin");
  });

  it("denies active-tenant non-admin (member)", async () => {
    const supabase = mockSupabase([
      { tenant_id: TENANT_A, role: "admin" },
      { tenant_id: TENANT_B, role: "member" },
    ]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: TENANT_B,
      source: "header",
      explicitRejected: false,
      queryError: false,
    });
    hasMinRole.mockResolvedValue(false);

    const result = await requireAdmin(supabase, headersWithTenant(TENANT_B));
    expect(result.allowed).toBe(false);
    expect(result.tenantId).toBe(TENANT_B);
    expect(result.adminTenantIds).toContain(TENANT_A);
  });

  it("denies admin-in-A when active tenant is B and role is member", async () => {
    const supabase = mockSupabase([
      { tenant_id: TENANT_A, role: "owner" },
      { tenant_id: TENANT_B, role: "member" },
    ]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: TENANT_B,
      source: "cookie",
      explicitRejected: false,
      queryError: false,
    });
    hasMinRole.mockResolvedValue(false);

    const result = await requireAdmin(supabase, new Headers());
    expect(result.allowed).toBe(false);
    expect(result.tenantId).toBe(TENANT_B);
  });

  it("allows member-in-A when active tenant B is admin", async () => {
    const supabase = mockSupabase([
      { tenant_id: TENANT_A, role: "member" },
      { tenant_id: TENANT_B, role: "admin" },
    ]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: TENANT_B,
      source: "header",
      explicitRejected: false,
      queryError: false,
    });
    hasMinRole.mockResolvedValue(true);

    const result = await requireAdmin(supabase, headersWithTenant(TENANT_B));
    expect(result.allowed).toBe(true);
    expect(result.tenantId).toBe(TENANT_B);
  });

  it("denies unauthorized active-tenant header/cookie (explicitRejected)", async () => {
    const supabase = mockSupabase([{ tenant_id: TENANT_A, role: "admin" }]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });

    const result = await requireAdmin(supabase, headersWithTenant(TENANT_B));
    expect(result.allowed).toBe(false);
    expect(result.tenantId).toBeNull();
    expect(result.blocked).toBe(true);
    expect(hasMinRole).not.toHaveBeenCalled();
  });

  it("denies duplicate active-tenant cookie (explicitRejected)", async () => {
    const supabase = mockSupabase([{ tenant_id: TENANT_A, role: "admin" }]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });

    const result = await requireAdmin(supabase, new Headers());
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it("denies active-tenant query error", async () => {
    const supabase = mockSupabase([{ tenant_id: TENANT_A, role: "admin" }]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: true,
    });

    const result = await requireAdmin(supabase, new Headers());
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(hasMinRole).not.toHaveBeenCalled();
  });

  it("denies when no active tenant", async () => {
    const supabase = mockSupabase([]);
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: false,
    });

    const result = await requireAdmin(supabase, new Headers());
    expect(result.allowed).toBe(false);
    expect(result.tenantId).toBeNull();
    expect(result.blocked).toBe(false);
  });

  it("denies unauthenticated users", async () => {
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    } as unknown as SupabaseClient;

    const result = await requireAdmin(supabase, new Headers());
    expect(result).toEqual({
      allowed: false,
      tenantId: null,
      adminTenantIds: [],
      blocked: false,
    });
  });
});
