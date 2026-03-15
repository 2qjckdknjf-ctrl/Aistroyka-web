import { describe, it, expect, vi } from "vitest";
import { getProjectHealthScore } from "./project-health-v2.service";

vi.mock("../mappers/snapshot.mapper", () => ({
  buildProjectSnapshot: vi.fn(),
}));

const { buildProjectSnapshot } = await import("../mappers/snapshot.mapper");

describe("getProjectHealthScore", () => {
  const supabase = {} as any;
  const projectId = "proj-1";
  const tenantId = "tenant-1";

  it("returns null when no snapshot", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue(null);
    const result = await getProjectHealthScore(supabase, projectId, tenantId);
    expect(result).toBeNull();
  });

  it("computes score with overdue penalty", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      workerCount: 2,
      reportCount: 1,
      openReportCount: 1,
      taskCount: 5,
      overdueTaskCount: 3,
      completedTaskCount: 0,
      mediaCount: 10,
      analysisCount: 2,
    });
    const result = await getProjectHealthScore(supabase, projectId, tenantId);
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThan(100);
    expect(result!.factorContributions.some((f) => f.factor === "Overdue tasks")).toBe(true);
    expect(result!.blockers).toContain("3 overdue task(s)");
  });

  it("applies no-reports penalty when workers but no reports", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      workerCount: 2,
      reportCount: 0,
      openReportCount: 0,
      taskCount: 0,
      overdueTaskCount: 0,
      completedTaskCount: 0,
      mediaCount: 0,
      analysisCount: 0,
    });
    const result = await getProjectHealthScore(supabase, projectId, tenantId);
    expect(result!.factorContributions.some((f) => f.factor === "No recent reports")).toBe(true);
    expect(result!.score).toBe(85);
  });

  it("degrades gracefully with no workers and no tasks", async () => {
    vi.mocked(buildProjectSnapshot).mockResolvedValue({
      projectId,
      tenantId,
      at: new Date().toISOString(),
      workerCount: 0,
      reportCount: 0,
      openReportCount: 0,
      taskCount: 0,
      overdueTaskCount: 0,
      completedTaskCount: 0,
      mediaCount: 0,
      analysisCount: 0,
    });
    const result = await getProjectHealthScore(supabase, projectId, tenantId);
    expect(result!.confidence).toBe("medium");
    expect(result!.missingDataDisclaimer).toBeTruthy();
  });
});
