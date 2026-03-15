import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActionRecommendations } from "./recommendation-engine.service";

vi.mock("./project-health.service", () => ({
  getProjectHealth: vi.fn(),
}));
vi.mock("./risk-intelligence.service", () => ({
  getRiskSignals: vi.fn(),
}));
vi.mock("@/lib/domain/costs/cost.repository", () => ({
  getBudgetSummary: vi.fn(),
}));

const { getProjectHealth } = await import("./project-health.service");
const { getRiskSignals } = await import("./risk-intelligence.service");
const { getBudgetSummary } = await import("@/lib/domain/costs/cost.repository");

function createSupabase(opts: { pendingReportsCount?: number; pendingDocumentsCount?: number } = {}) {
  const pendingReportsCount = opts.pendingReportsCount ?? 0;
  const pendingDocumentsCount = opts.pendingDocumentsCount ?? 0;
  const inner = {
    eq: vi.fn().mockResolvedValue({ count: pendingDocumentsCount }),
    then: (resolve: (v: { count: number }) => void) => {
      resolve({ count: pendingReportsCount });
      return Promise.resolve({ count: pendingReportsCount });
    },
    catch: () => Promise.resolve({ count: pendingReportsCount }),
  };
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(inner),
        }),
      }),
    }),
  } as any;
}

describe("getActionRecommendations", () => {
  const projectId = "proj-1";
  const tenantId = "tenant-1";

  beforeEach(() => {
    vi.mocked(getBudgetSummary).mockResolvedValue(null);
  });

  it("returns empty when no health", async () => {
    vi.mocked(getProjectHealth).mockResolvedValue(null);
    vi.mocked(getRiskSignals).mockResolvedValue([]);
    const result = await getActionRecommendations(createSupabase(), projectId, tenantId);
    expect(result).toEqual([]);
  });

  it("adds resolve blockers when health has blockers", async () => {
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 40,
      label: "critical",
      blockers: ["No recent reports"],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getRiskSignals).mockResolvedValue([]);
    const result = await getActionRecommendations(createSupabase(), projectId, tenantId);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Resolve blockers");
    expect(result[0].priority).toBe("high");
  });

  it("adds review high-priority risks with relatedResource when risks have resource", async () => {
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 60,
      label: "moderate",
      blockers: [],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getRiskSignals).mockResolvedValue([
      {
        projectId,
        source: "overdue",
        severity: "high",
        title: "Overdue task",
        at: new Date().toISOString(),
        resourceType: "task",
        resourceId: "task-123",
      },
    ]);
    const result = await getActionRecommendations(createSupabase(), projectId, tenantId);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Review high-priority risks");
    expect(result[0].relatedResourceType).toBe("task");
    expect(result[0].relatedResourceId).toBe("task-123");
  });

  it("adds review high-priority risks without relatedResource when no risk has resource", async () => {
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 60,
      label: "moderate",
      blockers: [],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getRiskSignals).mockResolvedValue([
      {
        projectId,
        source: "overdue",
        severity: "high",
        title: "Overdue task",
        at: new Date().toISOString(),
      },
    ]);
    const result = await getActionRecommendations(createSupabase(), projectId, tenantId);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Review high-priority risks");
    expect(result[0].relatedResourceType).toBeUndefined();
    expect(result[0].relatedResourceId).toBeUndefined();
  });

  it("adds review pending reports when tenant has submitted reports", async () => {
    const supabaseWithCount = createSupabase({ pendingReportsCount: 3 });
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 80,
      label: "good",
      blockers: [],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getRiskSignals).mockResolvedValue([]);
    const result = await getActionRecommendations(supabaseWithCount, projectId, tenantId);
    const pendingAction = result.find((r) => r.title === "Review pending reports");
    expect(pendingAction).toBeDefined();
    expect(pendingAction?.description).toBe("3 report(s) awaiting approval");
    expect(pendingAction?.relatedResourceType).toBe("reports_pending");
    expect(pendingAction?.relatedResourceId).toBe("list");
  });

  it("adds review pending documents when project has documents under_review", async () => {
    const supabaseWithDocs = createSupabase({ pendingDocumentsCount: 2 });
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 80,
      label: "good",
      blockers: [],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getRiskSignals).mockResolvedValue([]);
    const result = await getActionRecommendations(supabaseWithDocs, projectId, tenantId);
    const docAction = result.find((r) => r.title === "Review pending documents");
    expect(docAction).toBeDefined();
    expect(docAction?.description).toBe("2 document(s) awaiting approval");
    expect(docAction?.relatedResourceType).toBe("documents");
    expect(docAction?.relatedResourceId).toBe(projectId);
  });

  it("adds review project budget when over budget", async () => {
    vi.mocked(getBudgetSummary).mockResolvedValue({
      project_id: projectId,
      tenant_id: tenantId,
      planned_total: 10000,
      actual_total: 12000,
      currency: "RUB",
      over_budget: true,
      item_count: 3,
    });
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 80,
      label: "good",
      blockers: [],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getRiskSignals).mockResolvedValue([]);
    const result = await getActionRecommendations(createSupabase(), projectId, tenantId);
    const budgetAction = result.find((r) => r.title === "Review project budget");
    expect(budgetAction).toBeDefined();
    expect(budgetAction?.relatedResourceType).toBe("costs");
    expect(budgetAction?.relatedResourceId).toBe(projectId);
  });
});
