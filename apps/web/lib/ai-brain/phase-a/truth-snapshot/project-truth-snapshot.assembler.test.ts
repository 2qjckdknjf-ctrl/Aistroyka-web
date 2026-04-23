/**
 * AI Brain Phase A — Project Truth Snapshot assembler tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assembleProjectTruthSnapshot } from "./project-truth-snapshot.assembler";

vi.mock("@/lib/ai-brain/mappers", () => ({
  buildProjectSnapshot: vi.fn(),
}));
vi.mock("@/lib/domain/projects/project-summary.repository", () => ({
  getProjectSummary: vi.fn(),
}));
vi.mock("@/lib/domain/projects/project-status.service", () => ({
  deriveProjectStatus: vi.fn(),
}));
vi.mock("@/lib/ai-brain/services", () => ({
  getProjectHealth: vi.fn(),
  getReportSignals: vi.fn(),
  getEvidenceSignals: vi.fn(),
  getRiskSignals: vi.fn(),
  getTopRiskInsights: vi.fn(),
  getMissingEvidenceInsights: vi.fn(),
}));

const { buildProjectSnapshot } = await import("@/lib/ai-brain/mappers");
const { getProjectSummary } = await import("@/lib/domain/projects/project-summary.repository");
const { deriveProjectStatus } = await import("@/lib/domain/projects/project-status.service");
const {
  getProjectHealth,
  getReportSignals,
  getEvidenceSignals,
  getRiskSignals,
  getTopRiskInsights,
  getMissingEvidenceInsights,
} = await import("@/lib/ai-brain/services");

const supabase = {} as SupabaseClient;
const projectId = "proj-1";
const tenantId = "tenant-1";

describe("assembleProjectTruthSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deriveProjectStatus).mockReturnValue({
      projectStatus: "active",
      healthLevel: "good",
      statusReasons: [],
      attentionItems: [],
    });
    vi.mocked(getProjectSummary).mockResolvedValue({
      activeWorkers: 2,
      openReports: 1,
      aiAnalyses: 0,
      tasksTotal: 5,
      tasksInProgress: 2,
      tasksDone: 1,
      milestonesCount: 2,
      overdueMilestonesCount: 0,
      pendingReportApprovalsCount: 0,
      projectDocumentsActiveCount: 0,
      openIssuesCount: 0,
      pendingDecisionsCount: 0,
      budgetItemCount: 0,
      budgetOverBudget: false,
      budgetNearingLimit: false,
      budgetPlannedTotal: 0,
      budgetActualTotal: 0,
      budgetVarianceAmount: 0,
      budgetCurrency: "RUB",
      costLineOverrunCount: 0,
      budgetSignals: [],
    });
    vi.mocked(getProjectHealth).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      score: 80,
      label: "healthy",
      blockers: [],
      missingData: [],
      delayIndicators: [],
    });
    vi.mocked(getReportSignals).mockResolvedValue([]);
    vi.mocked(getEvidenceSignals).mockResolvedValue([]);
    vi.mocked(getRiskSignals).mockResolvedValue([]);
    vi.mocked(getTopRiskInsights).mockResolvedValue([]);
    vi.mocked(getMissingEvidenceInsights).mockResolvedValue([]);
  });

  it("returns null when snapshot is null", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue(null);
    const result = await assembleProjectTruthSnapshot(supabase, projectId, tenantId);
    expect(result).toBeNull();
  });

  it("returns full snapshot when all services succeed", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: "2026-03-22T12:00:00.000Z",
      workerCount: 2,
      reportCount: 1,
      openReportCount: 1,
      taskCount: 5,
      overdueTaskCount: 1,
      completedTaskCount: 1,
      mediaCount: 3,
      analysisCount: 0,
    });

    const result = await assembleProjectTruthSnapshot(supabase, projectId, tenantId);
    expect(result).not.toBeNull();
    expect(result!.tenantId).toBe(tenantId);
    expect(result!.projectId).toBe(projectId);
    expect(result!.projectStatus).toBe("active");
    expect(result!.openTaskCounts).toEqual({ total: 5, overdue: 1, completed: 1, inProgress: 2 });
    expect(result!.dataSufficiencyFlags.snapshot).toBe("full");
    expect(result!.dataSufficiencyFlags.health).toBe("full");
  });

  it("degrades safely when health is null", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: "2026-03-22T12:00:00.000Z",
      workerCount: 1,
      reportCount: 0,
      openReportCount: 0,
      taskCount: 2,
      overdueTaskCount: 0,
      completedTaskCount: 0,
      mediaCount: 0,
      analysisCount: 0,
    });
    vi.mocked(getProjectHealth).mockResolvedValue(null);

    const result = await assembleProjectTruthSnapshot(supabase, projectId, tenantId);
    expect(result).not.toBeNull();
    expect(result!.dataSufficiencyFlags.health).toBe("missing");
    expect(result!.intelligenceSummaryAvailability).toBe(false);
  });

  it("sets topRisksSummary and missingEvidenceSummary from services", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: "2026-03-22T12:00:00.000Z",
      workerCount: 1,
      reportCount: 0,
      openReportCount: 0,
      taskCount: 1,
      overdueTaskCount: 0,
      completedTaskCount: 0,
      mediaCount: 0,
      analysisCount: 0,
    });
    vi.mocked(getTopRiskInsights).mockResolvedValue([
      {
        id: "r1",
        projectId,
        rank: 1,
        severity: "high",
        title: "Overdue task",
        description: "",
        source: "inferred",
        explanation: "",
        evidenceReferences: [],
        confidence: "high",
        contributingFactors: [],
        recommendedAction: "",
        at: new Date().toISOString(),
      },
    ]);
    vi.mocked(getMissingEvidenceInsights).mockResolvedValue([
      {
        id: "me1",
        projectId,
        type: "task",
        severity: "medium",
        title: "Missing photos",
        explanation: "",
        evidenceReferences: [],
        confidence: "high",
        contributingFactors: [],
        recommendedAction: "",
        at: new Date().toISOString(),
      },
    ]);

    const result = await assembleProjectTruthSnapshot(supabase, projectId, tenantId);
    expect(result!.topRisksSummary).toEqual({ count: 1, highCount: 1 });
    expect(result!.missingEvidenceSummary).toEqual({ count: 1 });
    expect(result!.evidenceQualitySummary).toBe("gaps");
  });
});
