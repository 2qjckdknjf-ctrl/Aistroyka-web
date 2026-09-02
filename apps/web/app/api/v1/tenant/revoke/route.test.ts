import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getSessionUser = vi.fn();
const getOrCreateTenantForCurrentUser = vi.fn();
const hasMinRole = vi.fn();
const getRoleInTenant = vi.fn();
const getAdminClient = vi.fn();
const userDelete = vi.fn();
const tenantSingle = vi.fn();
const memberMaybeSingle = vi.fn();

function userFrom(table: string) {
  if (table === "tenants") {
    return {
      select: () => ({
        eq: () => ({
          single: tenantSingle,
        }),
      }),
    };
  }
  if (table === "tenant_members") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: memberMaybeSingle,
          }),
        }),
      }),
      delete: userDelete,
    };
  }
  return {};
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => userFrom(table),
  }),
  getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

vi.mock("@/lib/api/engine", () => ({
  getOrCreateTenantForCurrentUser: (...args: unknown[]) => getOrCreateTenantForCurrentUser(...args),
}));

vi.mock("@/lib/auth/tenant", () => ({
  hasMinRole: (...args: unknown[]) => hasMinRole(...args),
  getRoleInTenant: (...args: unknown[]) => getRoleInTenant(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

function revokeRequest(userId: string) {
  return new Request("https://test/api/v1/tenant/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
}

describe("POST /api/v1/tenant/revoke", () => {
  beforeEach(() => {
    getSessionUser.mockReset();
    getOrCreateTenantForCurrentUser.mockReset();
    hasMinRole.mockReset();
    getRoleInTenant.mockReset();
    getAdminClient.mockReset();
    userDelete.mockReset();
    tenantSingle.mockReset();
    memberMaybeSingle.mockReset();

    getSessionUser.mockResolvedValue({ id: "admin-1" });
    getOrCreateTenantForCurrentUser.mockResolvedValue("tenant-1");
    hasMinRole.mockResolvedValue(true);
    getRoleInTenant.mockResolvedValue("owner");
    tenantSingle.mockResolvedValue({ data: { user_id: "owner-1" }, error: null });
    memberMaybeSingle.mockResolvedValue({ data: { role: "member" }, error: null });
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionUser.mockResolvedValueOnce(null);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(401);
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("returns 403 when caller is not admin+", async () => {
    hasMinRole.mockResolvedValueOnce(false);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(403);
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("refuses to revoke the tenant owner", async () => {
    const res = await POST(revokeRequest("owner-1"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Cannot revoke owner" });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("returns 200 without writing when the member is already gone", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { ok: true } });
    expect(getAdminClient).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("deletes via service role and fails closed when 0 rows match", async () => {
    const adminDelete = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => ({
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    getAdminClient.mockReturnValue({
      from: (table: string) => {
        expect(table).toBe("tenant_members");
        return { delete: adminDelete };
      },
    });

    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Revoke failed" });
    expect(adminDelete).toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("returns 503 when service role is unavailable", async () => {
    getAdminClient.mockReturnValue(null);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(503);
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("removes the membership through the admin client", async () => {
    const adminDelete = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => ({
          select: vi.fn().mockResolvedValue({ data: [{ user_id: "member-1" }], error: null }),
        }),
      }),
    });
    getAdminClient.mockReturnValue({
      from: () => ({ delete: adminDelete }),
    });

    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { ok: true } });
    expect(adminDelete).toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });
});
