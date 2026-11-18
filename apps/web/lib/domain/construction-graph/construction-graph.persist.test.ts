import { describe, expect, it, vi } from "vitest";
import { persistConstructionGraphOverlay } from "./construction-graph.repository";
import { buildConstructionGraphFromSources } from "./construction-graph.model";

function graph() {
  return buildConstructionGraphFromSources("t1", "p1", {
    project: { id: "p1", name: "Villa" },
    tasks: [{ id: "task-1", title: "Pour", assigned_to: null }],
    reports: [],
    media: [],
    defects: [],
    documents: [],
  });
}

describe("persistConstructionGraphOverlay", () => {
  it("upserts node refs then inserts edges without SOT payloads", async () => {
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { id: "n-p", source_table: "projects", source_id: "p1" },
          { id: "n-t", source_table: "worker_tasks", source_id: "task-1" },
        ],
        error: null,
      }),
    });
    const pruneNot = vi.fn().mockResolvedValue({ error: null });
    const pruneEq2 = vi.fn().mockReturnValue({ not: pruneNot });
    const pruneEq1 = vi.fn().mockReturnValue({ eq: pruneEq2 });
    const nodeDelete = vi.fn().mockReturnValue({ eq: pruneEq1 });
    const delEq2 = vi.fn().mockResolvedValue({ error: null });
    const delEq1 = vi.fn().mockReturnValue({ eq: delEq2 });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "construction_graph_nodes") return { upsert, delete: nodeDelete };
      if (table === "construction_graph_edges") return { delete: () => ({ eq: delEq1 }), insert };
      throw new Error(table);
    });
    const result = await persistConstructionGraphOverlay({ from } as never, graph());
    expect(result.persisted).toBe(true);
    const nodePayload = upsert.mock.calls[0][0] as Array<{ family: string; title?: string }>;
    expect(nodePayload.every((row) => row.title === undefined)).toBe(true);
    expect(insert.mock.calls[0][0].length).toBeGreaterThan(0);
    expect(pruneNot).toHaveBeenCalledWith("id", "in", "(n-p,n-t)");
  });

  it("prunes stale overlay nodes whose source refs left the rebuilt graph", async () => {
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "n-keep", source_table: "projects", source_id: "p1" }],
        error: null,
      }),
    });
    const pruneNot = vi.fn().mockResolvedValue({ error: null });
    const pruneEq2 = vi.fn().mockReturnValue({ not: pruneNot });
    const pruneEq1 = vi.fn().mockReturnValue({ eq: pruneEq2 });
    const nodeDelete = vi.fn().mockReturnValue({ eq: pruneEq1 });
    const delEq2 = vi.fn().mockResolvedValue({ error: null });
    const delEq1 = vi.fn().mockReturnValue({ eq: delEq2 });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "construction_graph_nodes") return { upsert, delete: nodeDelete };
      if (table === "construction_graph_edges") return { delete: () => ({ eq: delEq1 }), insert };
      throw new Error(table);
    });
    const slim = buildConstructionGraphFromSources("t1", "p1", {
      project: { id: "p1", name: "Villa" },
      tasks: [],
      reports: [],
      media: [],
      defects: [],
      documents: [],
    });
    const result = await persistConstructionGraphOverlay({ from } as never, slim);
    expect(result.persisted).toBe(true);
    expect(nodeDelete).toHaveBeenCalled();
    expect(pruneNot).toHaveBeenCalledWith("id", "in", "(n-keep)");
  });

  it("treats missing overlay tables as non-fatal", async () => {
    const from = vi.fn().mockReturnValue({
      upsert: () => ({
        select: async () => ({ data: null, error: { message: 'relation "construction_graph_nodes" does not exist' } }),
      }),
    });
    const result = await persistConstructionGraphOverlay({ from } as never, graph());
    expect(result).toEqual({ persisted: false, reason: "overlay_unavailable" });
  });

  it("does not treat overlay RLS failures as a missing table", async () => {
    const from = vi.fn().mockReturnValue({
      upsert: () => ({
        select: async () => ({
          data: null,
          error: { message: 'new row violates row-level security policy for table "construction_graph_nodes"' },
        }),
      }),
    });
    const result = await persistConstructionGraphOverlay({ from } as never, graph());
    expect(result.persisted).toBe(false);
    expect(result.reason).toMatch(/row-level security/i);
  });
});
