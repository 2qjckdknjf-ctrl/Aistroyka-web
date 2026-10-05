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

  it("keeps later graph families when the node cap would be consumed by tasks", () => {
    const graph = buildConstructionGraphFromSources("t1", "p1", {
      project: { id: "p1", name: "Villa" },
      tasks: Array.from({ length: 40 }, (_, i) => ({
        id: `task-${i}`,
        title: `T${i}`,
        assigned_to: null,
      })),
      reports: [{ id: "rep-1", task_id: "task-0", user_id: null }],
      media: [{ id: "media-1", type: "image" }],
      defects: [{ id: "def-1", title: "Crack" }],
      documents: [{ id: "doc-1", title: "Permit", status: null }],
    });
    const ctx = buildConstructionGraphAIContext(graph, { maxNodes: 10, maxEdges: 20 });
    expect(ctx.truncated).toBe(true);
    expect(ctx.nodes.length).toBe(10);
    expect(ctx.summary.families.report).toBe(1);
    expect(ctx.summary.families.evidence).toBe(1);
    expect(ctx.summary.families.issue).toBe(1);
    expect(ctx.summary.families.document).toBe(1);
    const projected = new Set(ctx.nodes.map((n) => n.family));
    expect(projected.has("project")).toBe(true);
    expect(projected.has("task")).toBe(true);
    expect(projected.has("report")).toBe(true);
    expect(projected.has("evidence")).toBe(true);
    expect(projected.has("issue")).toBe(true);
    expect(projected.has("document")).toBe(true);
  });
});
