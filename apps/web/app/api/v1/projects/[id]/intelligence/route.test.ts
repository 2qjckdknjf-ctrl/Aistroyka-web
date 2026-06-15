import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const getTenantContextFromRequest = vi.fn().mockResolvedValue({
  tenantId: "tenant-a",
  userId: "user-1",
  role: "manager",
  subscriptionTier: null,
  clientProfile: "web",
  traceId: "trace-1",
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: vi.fn(),
}));

vi.mock("@/lib/ai-brain/use-cases", () => ({
  getManagerInsights: vi.fn().mockResolvedValue([]),
  getExecutiveSummaryForProject: vi.fn().mockResolvedValue(null),
  getRiskOverviewForProject: vi.fn().mockResolvedValue({}),
  getEvidenceCoverageForProject: vi.fn().mockResolvedValue({}),
  getReportingDisciplineForProject: vi.fn().mockResolvedValue({}),
  getActionRecommendationsForProject: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/ai-brain/services", () => ({
  getProjectHealth: vi.fn().mockResolvedValue({}),
  getMissingEvidenceInsights: vi.fn().mockResolvedValue([]),
  getTopRiskInsights: vi.fn().mockResolvedValue([]),
  getExecutiveProjectSummary: vi.fn().mockResolvedValue(null),
  getProjectHealthScore: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/operations/manager-intelligence-operational", () => ({
  buildManagerOperationalContext: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/observability/trace", () => ({
  getOrCreateRequestId: vi.fn().mockReturnValue("req-1"),
  addRequestIdToResponse: vi.fn((res: Response) => res),
}));

vi.mock("@/lib/observability/ai-telemetry", () => ({
  logIntelligenceComplete: vi.fn(),
  logIntelligenceError: vi.fn(),
  getAiReleaseCorrelation: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("GET /api/v1/projects/:id/intelligence", () => {
  beforeEach(async () => {
    const { getProject } = await import("@/lib/domain/projects/project.service");
    vi.mocked(getProject).mockResolvedValue({
      data: { id: "project-1", name: "Project" },
      error: null,
    });
  });

  it("returns 403 when project is outside tenant rights", async () => {
    const { getProject } = await import("@/lib/domain/projects/project.service");
    vi.mocked(getProject).mockResolvedValueOnce({ data: null, error: "Insufficient rights" });

    const res = await GET(new Request("https://test/api/v1/projects/project-1/intelligence"), {
      params: Promise.resolve({ id: "project-1" }),
    });
    expect(res.status).toBe(403);
  });
});
