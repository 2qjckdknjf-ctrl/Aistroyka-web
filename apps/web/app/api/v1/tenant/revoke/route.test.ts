import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getSessionUser = vi.fn();
const getOrCreateTenantForCurrentUser = vi.fn();
const hasMinRole = vi.fn();
const getRoleInTenant = vi.fn();
const getAdminClient = vi.fn();
const tenantSingle = vi.fn();
const memberMaybeSingle = vi.fn();

const accountMemberMaybeSingle = vi.fn();
const tenantDeleteSelect = vi.fn();
const accountUpdateFinal = vi.fn();
const projectUpdateFinal = vi.fn();
const adminTenantDelete = vi.fn();
const adminAccountUpdate = vi.fn();
const adminProjectUpdate = vi.fn();

function userFrom(table: string) {
  if (table === "tenants") {
    return {
      select: () => ({
        eq: () => ({ single: tenantSingle }),
      }),
    };
  }
  if (table === "tenant_members") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: memberMaybeSingle }),
        }),
      }),
    };
  }
  return {};
}

function adminFrom(table: string) {
  if (table === "tenant_members") {
    return {
      delete: adminTenantDelete,
    };
  }
  if (table === "account_members") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: accountMemberMaybeSingle }),
        }),
      }),
      update: adminAccountUpdate,
    };
  }
  if (table === "project_members") {
    return {
      update: adminProjectUpdate,
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
    vi.clearAllMocks();

    getSessionUser.mockResolvedValue({ id: "owner-1" });
    getOrCreateTenantForCurrentUser.mockResolvedValue("tenant-1");
    hasMinRole.mockResolvedValue(true);
    getRoleInTenant.mockResolvedValue("owner");
    tenantSingle.mockResolvedValue({
      data: { user_id: "owner-1", account_id: "account-1" },
      error: null,
    });
    memberMaybeSingle.mockResolvedValue({ data: { role: "member" }, error: null });
    accountMemberMaybeSingle.mockResolvedValue({
      data: { role: "member", status: "active" },
      error: null,
    });
    tenantDeleteSelect.mockResolvedValue({ data: [{ user_id: "member-1" }], error: null });
    accountUpdateFinal.mockResolvedValue({ data: null, error: null });
    projectUpdateFinal.mockResolvedValue({ data: null, error: null });

    adminTenantDelete.mockReturnValue({
      eq: () => ({
        eq: () => ({ select: tenantDeleteSelect }),
      }),
    });
    adminAccountUpdate.mockReturnValue({
      eq: () => ({ eq: accountUpdateFinal }),
    });
    adminProjectUpdate.mockReturnValue({
      eq: () => ({
        eq: () => ({ neq: projectUpdateFinal }),
      }),
    });
    getAdminClient.mockReturnValue({ from: adminFrom });
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

  it("refuses to revoke the tenant owner pointer", async () => {
    const res = await POST(revokeRequest("owner-1"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Cannot revoke owner" });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("only lets owner revoke a tenant admin", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
    getRoleInTenant.mockResolvedValueOnce("admin");
    const res = await POST(revokeRequest("admin-2"));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Only owner can revoke an admin" });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("returns 503 when service role is unavailable, even if tenant membership is already gone", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    getAdminClient.mockReturnValueOnce(null);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(503);
  });

  it("removes effective internal access across tenant, account and project memberships", async () => {
    const res = await POST(revokeRequest("member-1"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { ok: true } });
    expect(adminTenantDelete).toHaveBeenCalled();
    expect(tenantDeleteSelect).toHaveBeenCalled();
    expect(adminAccountUpdate).toHaveBeenCalledWith({ status: "removed" });
    expect(adminProjectUpdate).toHaveBeenCalledWith({ status: "removed" });
  });

  it("is idempotent but still cleans latent project access when tenant membership is already gone", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    accountMemberMaybeSingle.mockResolvedValueOnce({
      data: { role: "member", status: "removed" },
      error: null,
    });

    const res = await POST(revokeRequest("member-1"));

    expect(res.status).toBe(200);
    expect(adminTenantDelete).not.toHaveBeenCalled();
    expect(adminAccountUpdate).not.toHaveBeenCalled();
    expect(adminProjectUpdate).toHaveBeenCalledWith({ status: "removed" });
  });

  it("does not let an admin bypass the admin guard through a stale account_members row", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    accountMemberMaybeSingle.mockResolvedValueOnce({
      data: { role: "admin", status: "active" },
      error: null,
    });
    getRoleInTenant.mockResolvedValueOnce("admin");

    const res = await POST(revokeRequest("admin-2"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Only owner can revoke an admin" });
    expect(adminProjectUpdate).not.toHaveBeenCalled();
  });

  it("fails closed when tenant membership delete matches zero rows", async () => {
    tenantDeleteSelect.mockResolvedValueOnce({ data: [], error: null });

    const res = await POST(revokeRequest("member-1"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Revoke failed" });
    expect(adminAccountUpdate).not.toHaveBeenCalled();
    expect(adminProjectUpdate).not.toHaveBeenCalled();
  });

  it("fails closed on account or project cleanup errors", async () => {
    accountUpdateFinal.mockResolvedValueOnce({ data: null, error: { message: "account cleanup failed" } });
    let res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "account cleanup failed" });

    accountUpdateFinal.mockResolvedValueOnce({ data: null, error: null });
    projectUpdateFinal.mockResolvedValueOnce({ data: null, error: { message: "project cleanup failed" } });
    res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "project cleanup failed" });
  });
});
