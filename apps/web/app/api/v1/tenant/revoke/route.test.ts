import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getSessionUser = vi.fn();
const getOrCreateTenantForCurrentUser = vi.fn();
const hasMinRole = vi.fn();
const getRoleInTenant = vi.fn();
const getAdminClient = vi.fn();
const tenantSingle = vi.fn();
const memberMaybeSingle = vi.fn();

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

function adminClient(opts?: {
  projectError?: { message: string } | null;
  tenantDeleted?: Array<{ user_id: string }>;
  tenantError?: { message: string } | null;
}) {
  const projectDelete = vi.fn().mockReturnValue({
    eq: () => ({
      eq: vi.fn().mockResolvedValue({ error: opts?.projectError ?? null }),
    }),
  });
  const tenantDelete = vi.fn().mockReturnValue({
    eq: () => ({
      eq: () => ({
        select: vi.fn().mockResolvedValue({
          data: opts?.tenantDeleted ?? [{ user_id: "member-1" }],
          error: opts?.tenantError ?? null,
        }),
      }),
    }),
  });
  return {
    projectDelete,
    tenantDelete,
    client: {
      from: (table: string) => {
        if (table === "project_members") return { delete: projectDelete };
        if (table === "tenant_members") return { delete: tenantDelete };
        throw new Error(`Unexpected admin table ${table}`);
      },
    },
  };
}

describe("POST /api/v1/tenant/revoke", () => {
  beforeEach(() => {
    getSessionUser.mockReset();
    getOrCreateTenantForCurrentUser.mockReset();
    hasMinRole.mockReset();
    getRoleInTenant.mockReset();
    getAdminClient.mockReset();
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

  it("refuses to revoke the tenant owner", async () => {
    const res = await POST(revokeRequest("owner-1"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Cannot revoke owner" });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("only lets the owner revoke an admin", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
    getRoleInTenant.mockResolvedValueOnce("admin");
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(403);
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it("returns 503 when service role is unavailable", async () => {
    getAdminClient.mockReturnValue(null);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(503);
  });

  it("fails closed when project membership cleanup fails", async () => {
    const admin = adminClient({ projectError: { message: "project cleanup failed" } });
    getAdminClient.mockReturnValue(admin.client);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "project cleanup failed" });
    expect(admin.projectDelete).toHaveBeenCalled();
    expect(admin.tenantDelete).not.toHaveBeenCalled();
  });

  it("repairs stale project access even when tenant membership is already absent", async () => {
    memberMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const admin = adminClient();
    getAdminClient.mockReturnValue(admin.client);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { ok: true } });
    expect(admin.projectDelete).toHaveBeenCalled();
    expect(admin.tenantDelete).not.toHaveBeenCalled();
  });

  it("removes project memberships before the tenant membership", async () => {
    const calls: string[] = [];
    const projectDelete = vi.fn().mockReturnValue({
      eq: () => ({
        eq: vi.fn().mockImplementation(async () => {
          calls.push("project_members");
          return { error: null };
        }),
      }),
    });
    const tenantDelete = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => ({
          select: vi.fn().mockImplementation(async () => {
            calls.push("tenant_members");
            return { data: [{ user_id: "member-1" }], error: null };
          }),
        }),
      }),
    });
    getAdminClient.mockReturnValue({
      from: (table: string) =>
        table === "project_members" ? { delete: projectDelete } : { delete: tenantDelete },
    });

    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(200);
    expect(calls).toEqual(["project_members", "tenant_members"]);
  });

  it("fails when tenant membership deletion matches zero rows", async () => {
    const admin = adminClient({ tenantDeleted: [] });
    getAdminClient.mockReturnValue(admin.client);
    const res = await POST(revokeRequest("member-1"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Revoke failed" });
  });
});
