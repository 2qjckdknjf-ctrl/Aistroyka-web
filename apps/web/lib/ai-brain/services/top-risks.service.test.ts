import { describe, it, expect, vi } from "vitest";
import { getTopRiskInsights } from "./top-risks.service";

vi.mock("./risk-intelligence.service", () => ({
  getRiskSignals: vi.fn(),
}));

const { getRiskSignals } = await import("./risk-intelligence.service");

describe("getTopRiskInsights", () => {
  const supabase = {} as any;
  const projectId = "proj-1";
  const tenantId = "tenant-1";

  it("returns ranked insights from risk signals", async () => {
    vi.mocked(getRiskSignals).mockResolvedValue([
      {
        projectId,
        source: "overdue",
        severity: "high",
        title: "Overdue task",
        description: "Install wiring",
        at: new Date().toISOString(),
        resourceType: "task",
        resourceId: "task-1",
      },
      {
        projectId,
        source: "delay",
        severity: "medium",
        title: "Missing recent reports",
        description: "2 days without report",
        at: new Date().toISOString(),
      },
    ]);
    const result = await getTopRiskInsights(supabase, projectId, tenantId, 10);
    expect(result.length).toBe(2);
    expect(result[0].rank).toBe(1);
    expect(result[0].severity).toBe("high");
    expect(result[0].explanation).toBeTruthy();
    expect(result[0].recommendedAction).toBeTruthy();
    expect(result[0].evidenceReferences).toContainEqual({ resourceType: "task", resourceId: "task-1" });
  });

  it("limits to maxItems", async () => {
    vi.mocked(getRiskSignals).mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => ({
        projectId,
        source: "overdue",
        severity: "high",
        title: `Risk ${i}`,
        at: new Date().toISOString(),
      }))
    );
    const result = await getTopRiskInsights(supabase, projectId, tenantId, 5);
    expect(result.length).toBe(5);
  });
});
