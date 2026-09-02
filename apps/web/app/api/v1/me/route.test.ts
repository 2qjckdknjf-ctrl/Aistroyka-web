import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "./route";

const getTenantContextFromRequest = vi.fn();
const getAdminClient = vi.fn();
const checkRateLimit = vi.fn();
const emitAudit = vi.fn();
const deleteOwnAccountRecords = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Acme" }, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
}));

vi.mock("@/lib/tenant/tenant.types", () => ({
  isTenantContextPresent: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
}));

vi.mock("@/lib/auth/delete-own-account", () => ({
  isAccountDeleteConfirm: (raw: unknown) => {
    if (!raw || typeof raw !== "object") return false;
    const confirm = (raw as { confirm?: unknown }).confirm;
    return typeof confirm === "string" && confirm.trim() === "DELETE";
  },
  deleteOwnAccountRecords: (...args: unknown[]) => deleteOwnAccountRecords(...args),
}));

describe("GET /api/v1/me", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "admin",
    });
  });

  it("includes additive tenant_name", async () => {
    const res = await GET(new Request("https://test/api/v1/me"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        tenant_id: "tenant-1",
        user_id: "user-1",
        role: "admin",
        tenant_name: "Acme",
      },
    });
  });
});

describe("DELETE /api/v1/me", () => {
  beforeEach(() => {
    deleteOwnAccountRecords.mockReset();
    emitAudit.mockReset();
    checkRateLimit.mockResolvedValue({ limited: false });
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "admin",
    });
    getAdminClient.mockReturnValue({ id: "admin" });
    deleteOwnAccountRecords.mockResolvedValue({ error: null });
    emitAudit.mockResolvedValue(undefined);
  });

  it("returns 401 without an authenticated user", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      tenantId: null,
      userId: null,
      role: null,
    });
    const res = await DELETE(
      new Request("https://test/api/v1/me", {
        method: "DELETE",
        body: JSON.stringify({ confirm: "DELETE" }),
      })
    );
    expect(res.status).toBe(401);
    expect(deleteOwnAccountRecords).not.toHaveBeenCalled();
  });

  it("returns 400 without confirm DELETE", async () => {
    const res = await DELETE(
      new Request("https://test/api/v1/me", {
        method: "DELETE",
        body: JSON.stringify({ confirm: "yes" }),
      })
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "confirm_required" });
    expect(deleteOwnAccountRecords).not.toHaveBeenCalled();
  });

  it("returns 503 when admin client is missing", async () => {
    getAdminClient.mockReturnValueOnce(null);
    const res = await DELETE(
      new Request("https://test/api/v1/me", {
        method: "DELETE",
        body: JSON.stringify({ confirm: "DELETE" }),
      })
    );
    expect(res.status).toBe(503);
    expect(deleteOwnAccountRecords).not.toHaveBeenCalled();
  });

  it("deletes only the caller auth user and returns ok", async () => {
    const res = await DELETE(
      new Request("https://test/api/v1/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(deleteOwnAccountRecords).toHaveBeenCalledTimes(1);
    expect(deleteOwnAccountRecords.mock.calls[0]?.[1]).toBe("user-1");
    expect(emitAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "account_delete", user_id: "user-1", resource_id: "user-1" })
    );
  });
});
