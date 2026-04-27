import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as projectService from "@/lib/domain/projects/project.service";
import * as traceRepo from "@/lib/domain/traceability/traceability.repository";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/projects/project.service");
vi.mock("@/lib/domain/traceability/traceability.repository");

describe("GET /api/v1/projects/:id/traceability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(projectService.getProjectForInternalWorkspace).mockResolvedValue({
      data: { id: "p1", name: "P", tenant_id: "t1" } as never,
      error: null,
    });
    vi.mocked(traceRepo.getProjectTraceability).mockResolvedValue({
      projectId: "p1",
      tenantId: "t1",
      items: [],
      truncated: false,
    });
  });

  it("returns traceability payload for internal workspace", async () => {
    const res = await GET(new Request("https://test/api/v1/projects/p1/traceability"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.tenantId).toBe("t1");
    expect(traceRepo.getProjectTraceability).toHaveBeenCalledWith({}, "p1", "t1", 80);
  });

  it("respects limit query param", async () => {
    await GET(new Request("https://test/api/v1/projects/p1/traceability?limit=50"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(traceRepo.getProjectTraceability).toHaveBeenCalledWith({}, "p1", "t1", 50);
  });

  it("returns 403 when stakeholder-only", async () => {
    vi.mocked(projectService.getProjectForInternalWorkspace).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/traceability"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(403);
  });
});
