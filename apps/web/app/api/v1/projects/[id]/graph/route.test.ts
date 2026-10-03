import { describe, expect, it, vi, beforeEach } from "vitest";
import { createClientFromRequest } from "@/lib/supabase/server";
import { GET } from "./route";
import * as projectService from "@/lib/domain/projects/project.service";
import * as graphRepo from "@/lib/domain/construction-graph/construction-graph.repository";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: vi.fn(),
}));
vi.mock("@/lib/domain/construction-graph/construction-graph.repository", () => ({
  queryProjectConstructionGraph: vi.fn(),
}));

describe("GET /api/v1/projects/:id/graph", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    vi.mocked(createClientFromRequest).mockResolvedValue({ rpc } as never);
  });

  it("denies members without project membership", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: false, error: null });
    const res = await GET(new Request("https://test/api/v1/projects/p2/graph"), {
      params: Promise.resolve({ id: "p2" }),
    });
    expect(res.status).toBe(403);
    expect(projectService.getProject).not.toHaveBeenCalled();
  });

  it("allows owner/admin via can_read_project_membership", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    vi.mocked(projectService.getProject).mockResolvedValue({ data: { id: "p1" } as never, error: null });
    vi.mocked(graphRepo.queryProjectConstructionGraph).mockResolvedValue({
      graph: { project_id: "p1", tenant_id: "t1", nodes: [], edges: [], truncated: false },
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/graph"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
  });
});
