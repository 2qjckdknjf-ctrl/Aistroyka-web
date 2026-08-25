import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const listForUser = vi.fn();

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  listForUser: (...args: unknown[]) => listForUser(...args),
}));

vi.mock("@/lib/observability", () => ({
  withRequestIdAndTiming: vi.fn((_req: Request, res: Response) => res),
}));

describe("GET /api/v1/notifications", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    listForUser.mockReset();
    listForUser.mockResolvedValue({
      data: [
        {
          id: "n-issue",
          tenant_id: "tenant-1",
          user_id: "user-1",
          type: "issue_status_changed",
          title: "Issue resolved",
          body: "Fence",
          read_at: null,
          target_type: "issue",
          target_id: "iss-1",
          project_id: "proj-1",
          created_at: "2026-08-25T10:00:00Z",
        },
      ],
      total: 1,
    });
  });

  it("returns project_id so issue inbox rows can deep-link", async () => {
    const res = await GET(new Request("https://test/api/v1/notifications?limit=20"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; target_type?: string; target_id?: string; project_id?: string }[];
    };
    expect(body.data[0]?.id).toBe("n-issue");
    expect(body.data[0]?.target_type).toBe("issue");
    expect(body.data[0]?.target_id).toBe("iss-1");
    expect(body.data[0]?.project_id).toBe("proj-1");
    expect(listForUser).toHaveBeenCalledWith(
      expect.anything(),
      "tenant-1",
      "user-1",
      expect.objectContaining({ limit: 20, offset: 0 })
    );
  });
});
