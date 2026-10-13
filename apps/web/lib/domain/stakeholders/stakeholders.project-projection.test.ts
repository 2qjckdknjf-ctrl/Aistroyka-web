import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadClientPortalView, canRespondToClientRequests } from "./stakeholders.policy";
import { getActiveForUserOnProject } from "./stakeholders.repository";

vi.mock("@/lib/domain/projects/project-access", () => ({ isProjectOwner: vi.fn().mockResolvedValue(false) }));
vi.mock("./stakeholders.repository", () => ({ getActiveForUserOnProject: vi.fn() }));

const ctx: TenantContext = {
  tenantId: "tenant-a", userId: "customer-a", role: "stakeholder",
  subscriptionTier: "free", clientProfile: "ios_customer", traceId: "fixture-trace",
};

/** Model SQL SELECT projection, not a mock which invents unselected fields. */
function client(enabled = true): SupabaseClient {
  const row: Record<string, unknown> = {
    id: "project-a", tenant_id: "tenant-a", name: "Fixture", created_at: "2026-10-11",
    client_portal_enabled: enabled,
  };
  const from = vi.fn(() => {
    let columns: string[] = [];
    const filters: Record<string, unknown> = {};
    const query = {
      select: vi.fn((value: string) => { columns = value.split(",").map((s) => s.trim()); return query; }),
      eq: vi.fn((key: string, value: unknown) => { filters[key] = value; return query; }),
      maybeSingle: vi.fn(async () => ({
        data: Object.entries(filters).every(([key, value]) => row[key] === value)
          ? Object.fromEntries(columns.map((key) => [key, row[key]])) : null,
        error: null,
      })),
    };
    return query;
  });
  return { from } as unknown as SupabaseClient;
}

describe("portal authorization with the real project repository projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveForUserOnProject).mockResolvedValue({ stakeholder_role: "client_decision_maker", status: "active" } as never);
  });

  it("reads the enabled project for an active stakeholder", async () => {
    expect(await canReadClientPortalView(client(), ctx, "project-a")).toBe(true);
  });

  it("allows an active decision maker to respond on the enabled project", async () => {
    expect(await canRespondToClientRequests(client(), ctx, "project-a")).toBe(true);
  });

  it("keeps client viewers read-only", async () => {
    vi.mocked(getActiveForUserOnProject).mockResolvedValue({ stakeholder_role: "client_viewer", status: "active" } as never);
    const db = client();
    expect(await canReadClientPortalView(db, ctx, "project-a")).toBe(true);
    expect(await canRespondToClientRequests(db, ctx, "project-a")).toBe(false);
  });

  it("denies a disabled project before looking up the grant", async () => {
    expect(await canReadClientPortalView(client(false), ctx, "project-a")).toBe(false);
    expect(getActiveForUserOnProject).not.toHaveBeenCalled();
  });

  it("denies a revoked or absent grant", async () => {
    vi.mocked(getActiveForUserOnProject).mockResolvedValue(null);
    expect(await canReadClientPortalView(client(), ctx, "project-a")).toBe(false);
  });

  it("preserves explicit project and tenant filters", async () => {
    expect(await canReadClientPortalView(client(), ctx, "project-b")).toBe(false);
    expect(await canReadClientPortalView(client(), { ...ctx, tenantId: "tenant-b" }, "project-a")).toBe(false);
    expect(getActiveForUserOnProject).not.toHaveBeenCalled();
  });
});
