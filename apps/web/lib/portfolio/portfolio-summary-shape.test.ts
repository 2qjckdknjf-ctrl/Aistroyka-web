import { describe, it, expect } from "vitest";

/**
 * Deterministic portfolio summary shaping: distribution and attention from raw project rows.
 * Used to validate aggregation logic without calling the API.
 */
export function computeDistribution(projects: { healthLabel: string | null; confidence: string | null }[]) {
  const healthy = projects.filter((p) => p.healthLabel === "healthy").length;
  const moderate = projects.filter((p) => p.healthLabel === "moderate").length;
  const unstable = projects.filter((p) => p.healthLabel === "unstable").length;
  const critical = projects.filter((p) => p.healthLabel === "critical").length;
  const lowConfidence = projects.filter(
    (p) => p.confidence && String(p.confidence).toLowerCase().includes("low")
  ).length;
  const noData = projects.filter((p) => p.healthLabel == null).length;
  return { healthy, moderate, unstable, critical, lowConfidence, noData };
}

export function getAttentionProjects(
  projects: { id: string; name: string; requiresAttentionReasons: string[] }[]
) {
  return projects.filter((p) => p.requiresAttentionReasons.length > 0);
}

describe("portfolio summary shape", () => {
  describe("computeDistribution", () => {
    it("returns zeros when no projects", () => {
      const dist = computeDistribution([]);
      expect(dist).toEqual({
        healthy: 0,
        moderate: 0,
        unstable: 0,
        critical: 0,
        lowConfidence: 0,
        noData: 0,
      });
    });

    it("counts health labels correctly", () => {
      const dist = computeDistribution([
        { healthLabel: "healthy", confidence: null },
        { healthLabel: "healthy", confidence: null },
        { healthLabel: "moderate", confidence: null },
        { healthLabel: "critical", confidence: null },
        { healthLabel: null, confidence: null },
      ]);
      expect(dist.healthy).toBe(2);
      expect(dist.moderate).toBe(1);
      expect(dist.critical).toBe(1);
      expect(dist.noData).toBe(1);
    });

    it("counts low confidence when confidence string contains low", () => {
      const dist = computeDistribution([
        { healthLabel: "moderate", confidence: "low" },
        { healthLabel: "healthy", confidence: "high" },
      ]);
      expect(dist.lowConfidence).toBe(1);
    });
  });

  describe("getAttentionProjects", () => {
    it("returns only projects with at least one reason", () => {
      const projects = [
        { id: "p1", name: "A", requiresAttentionReasons: ["Critical health"] },
        { id: "p2", name: "B", requiresAttentionReasons: [] },
        { id: "p3", name: "C", requiresAttentionReasons: ["Over budget"] },
      ];
      const attention = getAttentionProjects(projects);
      expect(attention).toHaveLength(2);
      expect(attention.map((p) => p.id)).toEqual(["p1", "p3"]);
    });
  });
});
