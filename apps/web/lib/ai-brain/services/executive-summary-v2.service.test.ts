import { describe, it, expect, vi } from "vitest";
import { getExecutiveProjectSummary } from "./executive-summary-v2.service";

vi.mock("./project-health.service", () => ({
  getProjectHealth: vi.fn(),
}));
vi.mock("./risk-intelligence.service", () => ({
  getRiskSignals: vi.fn(),
}));
vi.mock("../mappers/snapshot.mapper", () => ({
  buildProjectSnapshot: vi.fn(),
}));
vi.mock("./report-intelligence.service", () => ({
  getReportSignals: vi.fn(),
}));
vi.mock("./evidence-intelligence.service", () => ({
  getEvidenceSignals: vi.fn(),
}));
vi.mock("./milestone-pressure.service", () => ({
  getMilestonePressureSignals: vi.fn().mockResolvedValue([]),
}));

const { getProjectHealth } = await import("./project-health.service");
const { buildProjectSnapshot } = await import("../mappers/snapshot.mapper");
const { getRiskSignals } = await import("./risk-intelligence.service");
const { getReportSignals } = await import("./report-intelligence.service");
const { getEvidenceSignals } = await import("./evidence-intelligence.service");

describe("getExecutiveProjectSummary", () => {
  const supabase = {} as any;
  const projectId = "proj-1";
  const tenantId = "tenant-1";

  it("returns null when no health", async () => {
    vi.mocked(getProjectHealth).mockResolvedValue(null);
    const result = await getExecutiveProjectSummary(supabase, projectId, tenantId);
    expect(result).toBeNull();
  });

  it("produces grounded summary with dataSufficiency", async () => {
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 75,
      label: "moderate",
      blockers: ["2 overdue task(s)"],
      missingData: [],
      delayIndicators: ["Overdue tasks"],
    });
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      workerCount: 2,
      reportCount: 5,
      openReportCount: 3,
      taskCount: 10,
      overdueTaskCount: 2,
      completedTaskCount: 3,
      mediaCount: 20,
      analysisCount: 5,
    });
    vi.mocked(getRiskSignals).mockResolvedValue([
      { projectId, source: "overdue", severity: "high", title: "Overdue task", at: new Date().toISOString() },
    ]);
    vi.mocked(getReportSignals).mockResolvedValue([
      { projectId, type: "submitted", severity: "low", message: "Report", at: new Date().toISOString() },
    ]);
    vi.mocked(getEvidenceSignals).mockResolvedValue([]);

    const result = await getExecutiveProjectSummary(supabase, projectId, tenantId);
    expect(result).not.toBeNull();
    expect(result!.recentProgress.length).toBeGreaterThan(0);
    expect(result!.atRisk.length).toBeGreaterThan(0);
    expect(result!.missingEvidence.length).toBeGreaterThan(0);
    expect(result!.requiresAttention.length).toBeGreaterThan(0);
    expect(result!.dataSufficiency).toBeDefined();
    expect(["sufficient", "partial", "insufficient"]).toContain(result!.dataSufficiency);
  });
});
