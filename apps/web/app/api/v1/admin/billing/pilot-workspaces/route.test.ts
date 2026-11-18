import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: vi.fn().mockResolvedValue({ ok: true, supabase: {}, userId: "u1", role: "OWNER" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));
vi.mock("@/lib/platform/billing-readiness/billing-pilot-ops.service", () => ({
  listBillingPilotWorkspacesSummary: vi.fn(),
  addWorkspaceToPilotCohort: vi.fn(),
}));

const { getAdminClient } = await import("@/lib/supabase/admin");
const { listBillingPilotWorkspacesSummary, addWorkspaceToPilotCohort } = await import("@/lib/platform/billing-readiness/billing-pilot-ops.service");

describe("GET /api/v1/admin/billing/pilot-workspaces", () => {
  beforeEach(() => {
    vi.mocked(getAdminClient).mockReturnValue({} as never);
    vi.mocked(listBillingPilotWorkspacesSummary).mockResolvedValue([]);
  });

  it("returns workspaces list", async () => {
    vi.mocked(listBillingPilotWorkspacesSummary).mockResolvedValue([
      { workspaceId: "w1", inPilotCohort: true, source: "db", liveCheckoutEnabled: true, webhookProcessingEnabled: true, cohortLabel: null, createdAt: null, updatedAt: null },
    ]);
    const { GET } = await import("./route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/pilot-workspaces"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.workspaces).toHaveLength(1);
    expect(body.workspaces[0].workspaceId).toBe("w1");
  });
});

describe("POST /api/v1/admin/billing/pilot-workspaces", () => {
  beforeEach(() => {
    vi.mocked(getAdminClient).mockReturnValue({} as never);
    vi.mocked(addWorkspaceToPilotCohort).mockResolvedValue({
      data: { workspaceId: "w1", inPilotCohort: true, source: "db", liveCheckoutEnabled: true, webhookProcessingEnabled: true, cohortLabel: null, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
      error: null,
    });
  });

  it("returns 400 when workspaceId missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(new Request("https://x/api/v1/admin/billing/pilot-workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it("adds workspace to pilot", async () => {
    const { POST } = await import("./route");
    const res = await POST(new Request("https://x/api/v1/admin/billing/pilot-workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: "11111111-1111-1111-1111-111111111111" }),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workspace.workspaceId).toBe("w1");
  });
});
