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
});
