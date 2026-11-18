import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const singleMock = vi.fn();
const membersQuery = vi.fn();
const getUserById = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      if (table === "tenants") {
        return {
          select: () => ({
            eq: () => ({
              single: singleMock,
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: membersQuery,
          }),
        }),
      };
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({
    auth: { admin: { getUserById } },
  })),
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

describe("GET /api/v1/tenant/members", () => {
  beforeEach(() => {
    singleMock.mockReset();
    membersQuery.mockReset();
    getUserById.mockReset();
  });

  it("adds email from auth admin when available", async () => {
    singleMock.mockResolvedValue({ data: { user_id: "owner-1" }, error: null });
    membersQuery.mockResolvedValue({
      data: [{ user_id: "owner-1", role: "owner", created_at: "2026-08-01T00:00:00Z" }],
      error: null,
    });
    getUserById.mockResolvedValue({ data: { user: { email: "owner@example.com" } } });

    const res = await GET(new Request("https://test/api/v1/tenant/members"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [
        {
          user_id: "owner-1",
          role: "owner",
          created_at: "2026-08-01T00:00:00Z",
          is_owner: true,
          email: "owner@example.com",
        },
      ],
    });
  });
});
