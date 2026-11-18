import { describe, expect, it, vi, beforeEach } from "vitest";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { GET } from "./route";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import * as graphRepo from "@/lib/domain/construction-graph/construction-graph.repository";

const memberCtx = {
  tenantId: "t1",
  userId: "u1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "web",
  traceId: "trace1",
};

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
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(),
}));
vi.mock("@/lib/domain/construction-graph/construction-graph.repository", () => ({
  queryProjectConstructionGraph: vi.fn(),
}));

describe("GET /api/v1/projects/:id/graph", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    vi.mocked(getTenantContextFromRequest).mockResolvedValue(memberCtx as never);
    vi.mocked(createClientFromRequest).mockResolvedValue({ rpc } as never);
    vi.mocked(projectRepo.getById).mockResolvedValue({ id: "p1" } as never);
    vi.mocked(graphRepo.queryProjectConstructionGraph).mockResolvedValue({
      graph: { project_id: "p1", tenant_id: "t1", nodes: [], edges: [], truncated: false },
      error: "",
    });
  });

  it("denies members without project membership", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: false, error: null });
    const res = await GET(new Request("https://test/api/v1/projects/p2/graph"), {
      params: Promise.resolve({ id: "p2" }),
    });
    expect(res.status).toBe(403);
    expect(projectRepo.getById).not.toHaveBeenCalled();
  });

  it("allows owner/admin via can_read_project_membership", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    const res = await GET(new Request("https://test/api/v1/projects/p1/graph"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
  });

  it("allows an active portal stakeholder without canReadProjects", async () => {
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      ...memberCtx,
      role: "stakeholder",
    } as never);
    rpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: true, error: null });
    const res = await GET(new Request("https://test/api/v1/projects/p1/graph"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    expect(projectRepo.getById).toHaveBeenCalled();
  });

  it("returns AI context projection when view=ai_context", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    vi.mocked(graphRepo.queryProjectConstructionGraph).mockResolvedValue({
      graph: {
        project_id: "p1",
        tenant_id: "t1",
        truncated: false,
        nodes: [
          {
            id: "projects:p1",
            family: "project",
            source_table: "projects",
            source_id: "p1",
            project_id: "p1",
            tenant_id: "t1",
            label: "Villa",
            provenance: { kind: "sot_row", table: "projects", id: "p1" },
          },
        ],
        edges: [],
      },
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/graph?view=ai_context"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.disclaimer).toBe("overlay_refs_only_not_contractual_truth");
    expect(body.data.nodes[0].source).toEqual({ table: "projects", id: "p1" });
  });
});
