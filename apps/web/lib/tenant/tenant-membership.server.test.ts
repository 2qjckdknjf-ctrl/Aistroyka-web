import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetSessionUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
}));

import {
  getRoleInTenant,
  hasMinRole,
  isTenantRoleDb,
  roleAtLeast,
} from "./tenant-membership.server";

function makeSupabase(opts: {
  tenantOwnerId?: string | null;
  memberRole?: string | null;
  tenantError?: unknown;
  memberError?: unknown;
}) {
  return {
    from: (table: string) => {
      if (table === "tenants") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.tenantOwnerId == null ? null : { user_id: opts.tenantOwnerId },
                error: opts.tenantError ?? null,
              }),
            }),
          }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: opts.memberRole == null ? null : { role: opts.memberRole },
                  error: opts.memberError ?? null,
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as never;
}

describe("tenant-membership.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
  });

  it("recognizes stakeholder in the role union", () => {
    expect(isTenantRoleDb("stakeholder")).toBe(true);
    expect(isTenantRoleDb("owner")).toBe(true);
    expect(isTenantRoleDb("bogus")).toBe(false);
  });

  it("roleAtLeast: stakeholder never satisfies viewer+", () => {
    expect(roleAtLeast("stakeholder", "viewer")).toBe(false);
    expect(roleAtLeast("stakeholder", "member")).toBe(false);
    expect(roleAtLeast("stakeholder", "admin")).toBe(false);
    expect(roleAtLeast("stakeholder", "owner")).toBe(false);
    expect(roleAtLeast("stakeholder", "stakeholder")).toBe(true);
    expect(roleAtLeast("viewer", "viewer")).toBe(true);
    expect(roleAtLeast("admin", "member")).toBe(true);
  });

  it("getRoleInTenant returns stakeholder (legacy omitted this)", async () => {
    const supabase = makeSupabase({ tenantOwnerId: "other", memberRole: "stakeholder" });
    await expect(getRoleInTenant(supabase, "t1")).resolves.toBe("stakeholder");
  });

  it("getRoleInTenant returns owner when user owns tenant", async () => {
    const supabase = makeSupabase({ tenantOwnerId: "user-1" });
    await expect(getRoleInTenant(supabase, "t1")).resolves.toBe("owner");
  });

  it("hasMinRole denies stakeholder for admin/member thresholds", async () => {
    const supabase = makeSupabase({ tenantOwnerId: "other", memberRole: "stakeholder" });
    await expect(hasMinRole(supabase, "t1", "admin")).resolves.toBe(false);
    await expect(hasMinRole(supabase, "t1", "member")).resolves.toBe(false);
    await expect(hasMinRole(supabase, "t1", "viewer")).resolves.toBe(false);
  });

  it("hasMinRole allows admin for admin threshold", async () => {
    const supabase = makeSupabase({ tenantOwnerId: "other", memberRole: "admin" });
    await expect(hasMinRole(supabase, "t1", "admin")).resolves.toBe(true);
    await expect(hasMinRole(supabase, "t1", "member")).resolves.toBe(true);
  });

  it("returns null / false with no session", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const supabase = makeSupabase({ tenantOwnerId: "user-1" });
    await expect(getRoleInTenant(supabase, "t1")).resolves.toBeNull();
    await expect(hasMinRole(supabase, "t1", "viewer")).resolves.toBe(false);
  });
});
