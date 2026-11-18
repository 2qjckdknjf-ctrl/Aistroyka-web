import { describe, expect, it } from "vitest";
import { buildConstructionGraphFromSources } from "./construction-graph.model";

describe("buildConstructionGraphFromSources", () => {
  it("references source-of-truth ids and keeps tenant/project scope", () => {
    const graph = buildConstructionGraphFromSources("tenant-1", "project-1", {
      project: { id: "project-1", name: "Villa" },
      tasks: [{ id: "task-1", title: "Pour slab", assigned_to: "user-w" }],
      reports: [{ id: "rep-1", task_id: "task-1", user_id: "user-w" }],
      media: [{ id: "media-1", type: "image" }],
      defects: [{ id: "def-1", title: "Crack" }],
      documents: [{ id: "doc-1", title: "Permit", status: "approved" }],
    });

    expect(graph.tenant_id).toBe("tenant-1");
    expect(graph.project_id).toBe("project-1");
    expect(graph.nodes.every((n) => n.tenant_id === "tenant-1" && n.project_id === "project-1")).toBe(true);
    expect(graph.nodes.find((n) => n.family === "task")?.source_id).toBe("task-1");
    expect(graph.nodes.find((n) => n.family === "report")?.source_table).toBe("worker_reports");
    expect(graph.edges.some((e) => e.kind === "reported_on" && e.to_id === "worker_tasks:task-1")).toBe(true);
    expect(graph.nodes.find((n) => n.family === "decision")?.source_id).toBe("doc-1");
    expect(graph.nodes.every((n) => n.provenance.kind === "sot_row")).toBe(true);
    expect(graph.truncated).toBe(false);
  });

  it("does not invent a report-task edge when the task is missing", () => {
    const graph = buildConstructionGraphFromSources("t", "p", {
      project: { id: "p", name: "P" },
      tasks: [],
      reports: [{ id: "rep-x", task_id: "missing-task", user_id: null }],
      media: [],
      defects: [],
      documents: [],
    });
    expect(graph.edges.some((e) => e.to_id === "worker_tasks:missing-task")).toBe(false);
    expect(graph.edges.some((e) => e.kind === "reported_on" && e.to_id === "projects:p")).toBe(true);
  });

  it("links accepted ai_analysis to media and skips orphan media ids", () => {
    const graph = buildConstructionGraphFromSources("t", "p", {
      project: { id: "p", name: "P" },
      tasks: [],
      reports: [],
      media: [{ id: "media-1", type: "image" }],
      defects: [],
      documents: [],
      accepted_analyses: [
        { id: "a1", media_id: "media-1", stage: "foundation", risk_level: "low" },
        { id: "a-orphan", media_id: "missing-media", stage: "roof", risk_level: "high" },
      ],
    });
    expect(graph.nodes.some((n) => n.source_table === "ai_analysis" && n.source_id === "a1")).toBe(
      true
    );
    expect(graph.nodes.some((n) => n.source_id === "a-orphan")).toBe(false);
    expect(
      graph.edges.some(
        (e) =>
          e.kind === "evidences" &&
          e.from_id === "ai_analysis:a1" &&
          e.to_id === "media:media-1"
      )
    ).toBe(true);
  });
});
