import { describe, expect, it } from "vitest";
import { buildConstructionGraphFromSources } from "./construction-graph.model";
import { buildConstructionGraphAIContext } from "./construction-graph.ai-context";

describe("buildConstructionGraphAIContext", () => {
  it("projects source refs and provenance without SOT payloads", () => {
    const graph = buildConstructionGraphFromSources("t1", "p1", {
      project: { id: "p1", name: "Villa" },
      tasks: [{ id: "task-1", title: "Pour", assigned_to: null }],
      reports: [],
      media: [],
      defects: [],
      documents: [],
    });
    const ctx = buildConstructionGraphAIContext(graph);
    expect(ctx.disclaimer).toBe("overlay_refs_only_not_contractual_truth");
    expect(ctx.summary.node_count).toBeGreaterThan(0);
    expect(ctx.nodes.every((n) => n.source.table && n.source.id)).toBe(true);
    expect(JSON.stringify(ctx)).not.toMatch(/budget|finance|cost|stripe/i);
    expect(ctx.nodes.some((n) => n.family === "task")).toBe(true);
  });

  it("marks truncated when node cap is exceeded", () => {
    const graph = buildConstructionGraphFromSources("t1", "p1", {
      project: { id: "p1", name: "Villa" },
      tasks: Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        title: `T${i}`,
        assigned_to: null,
      })),
      reports: [],
      media: [],
      defects: [],
      documents: [],
    });
    const ctx = buildConstructionGraphAIContext(graph, { maxNodes: 2, maxEdges: 2 });
    expect(ctx.truncated).toBe(true);
    expect(ctx.nodes.length).toBe(2);
    expect(ctx.edges.length).toBeLessThanOrEqual(2);
  });
});
