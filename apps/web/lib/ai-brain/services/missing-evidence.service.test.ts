import { describe, it, expect, vi } from "vitest";
import { getMissingEvidenceInsights } from "./missing-evidence.service";

vi.mock("./evidence-intelligence.service", () => ({
  getEvidenceSignals: vi.fn(),
}));
vi.mock("./evidence-staleness.service", () => ({
  getStalenessSignals: vi.fn(),
}));
vi.mock("./report-intelligence.service", () => ({
  getReportSignals: vi.fn(),
}));

const { getEvidenceSignals } = await import("./evidence-intelligence.service");
const { getStalenessSignals } = await import("./evidence-staleness.service");
const { getReportSignals } = await import("./report-intelligence.service");

describe("getMissingEvidenceInsights", () => {
  const supabase = {} as any;
  const projectId = "proj-1";
  const tenantId = "tenant-1";

  it("returns empty when no evidence or report gaps", async () => {
    vi.mocked(getEvidenceSignals).mockResolvedValue([]);
    vi.mocked(getStalenessSignals).mockResolvedValue([]);
    vi.mocked(getReportSignals).mockResolvedValue([
      { projectId, type: "submitted", severity: "low", message: "Report submitted", at: new Date().toISOString() },
    ]);
    const result = await getMissingEvidenceInsights(supabase, projectId, tenantId);
    expect(result).toHaveLength(0);
  });

  it("produces task insight for partial evidence", async () => {
    vi.mocked(getStalenessSignals).mockResolvedValue([]);
    vi.mocked(getEvidenceSignals).mockResolvedValue([
      {
        projectId,
        taskId: "task-1",
        type: "partial",
        severity: "high",
        required: 5,
        actual: 2,
        message: 'Task "Install wiring" has 2/5 evidence',
        at: new Date().toISOString(),
      },
    ]);
    vi.mocked(getReportSignals).mockResolvedValue([]);
    const result = await getMissingEvidenceInsights(supabase, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("task");
    expect(result[0].explanation).toContain("5");
    expect(result[0].explanation).toContain("2");
    expect(result[0].evidenceReferences).toContainEqual({ resourceType: "task", resourceId: "task-1" });
    expect(result[0].recommendedAction).toBeTruthy();
  });

  it("produces report insight for missing reports", async () => {
    vi.mocked(getEvidenceSignals).mockResolvedValue([]);
    vi.mocked(getStalenessSignals).mockResolvedValue([]);
    vi.mocked(getReportSignals).mockResolvedValue([
      { projectId, type: "missing", severity: "low", dayId: "day-1", message: "No report submitted for 2025-03-10", at: new Date().toISOString() },
      { projectId, type: "missing", severity: "low", dayId: "day-2", message: "No report submitted for 2025-03-11", at: new Date().toISOString() },
    ]);
    const result = await getMissingEvidenceInsights(supabase, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("report");
    expect(result[0].title).toContain("2");
    expect(result[0].evidenceReferences.length).toBeGreaterThan(0);
  });

  it("produces before_after insight for before_after_gap evidence", async () => {
    vi.mocked(getStalenessSignals).mockResolvedValue([]);
    vi.mocked(getEvidenceSignals).mockResolvedValue([
      {
        projectId,
        taskId: "task-1",
        type: "before_after_gap",
        severity: "medium",
        required: 2,
        actual: 1,
        message: 'Task "Install wiring" evidence: before: 0/1; after: 1/1',
        at: new Date().toISOString(),
      },
    ]);
    vi.mocked(getReportSignals).mockResolvedValue([]);
    const result = await getMissingEvidenceInsights(supabase, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("before_after");
    expect(result[0].title).toContain("Before/after");
  });

  it("produces stale insight for stale evidence", async () => {
    vi.mocked(getEvidenceSignals).mockResolvedValue([]);
    vi.mocked(getStalenessSignals).mockResolvedValue([
      {
        projectId,
        type: "stale",
        severity: "medium",
        message: "No evidence in last 14 days (last: 2025-02-01) while project has recent activity",
        at: new Date().toISOString(),
      },
    ]);
    vi.mocked(getReportSignals).mockResolvedValue([]);
    const result = await getMissingEvidenceInsights(supabase, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("stale");
    expect(result[0].title).toContain("Stale");
  });
});
