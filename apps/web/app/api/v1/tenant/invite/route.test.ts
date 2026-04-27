import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const insertMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      if (table === "tenant_invitations") {
        return {
          insert: insertMock,
        };
      }
      return {};
    },
  }),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    userId: "user-1",
    role: "admin",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  authorize: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/app-url", () => ({
  getAppUrl: vi.fn().mockReturnValue("https://app.example.com"),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/v1/tenant/invite", () => {
  beforeEach(() => {
    insertMock.mockReset();
    selectMock.mockReset();
    singleMock.mockReset();
  });

  it("returns 201-style payload with accept_link on success", async () => {
    insertMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      single: singleMock,
    });
    singleMock.mockResolvedValue({
      data: {
        id: "inv-1",
        token: "550e8400-e29b-41d4-a716-446655440000",
        email: "a@b.com",
        role: "member",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
      error: null,
    });

    const req = new Request("https://x/api/v1/tenant/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", role: "member" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { accept_link: string } };
    expect(body.data.accept_link).toContain("/invite/accept?token=");
  });

  it("returns 503 when tenant_invitations table is missing from schema cache", async () => {
    insertMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      single: singleMock,
    });
    singleMock.mockResolvedValue({
      data: null,
      error: {
        message: "Could not find the table 'public.tenant_invitations' in the schema cache",
        code: "PGRST204",
      },
    });

    const req = new Request("https://x/api/v1/tenant/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("migrations");
  });
});
