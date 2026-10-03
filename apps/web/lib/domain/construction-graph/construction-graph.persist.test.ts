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

function nodeUpsertOk() {
  return vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({
      data: [
        { id: "n-p", source_table: "projects", source_id: "p1" },
        { id: "n-t", source_table: "worker_tasks", source_id: "task-1" },
      ],
      error: null,
    }),
  });
}

describe("persistConstructionGraphOverlay", () => {
  it("upserts node refs then upserts edges without SOT payloads", async () => {
    const upsert = nodeUpsertOk();
    const delEq2 = vi.fn().mockResolvedValue({ error: null });
    const delEq1 = vi.fn().mockReturnValue({ eq: delEq2 });
    const edgeUpsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "construction_graph_nodes") return { upsert };
      if (table === "construction_graph_edges") return { delete: () => ({ eq: delEq1 }), upsert: edgeUpsert };
      throw new Error(table);
    });
    const result = await persistConstructionGraphOverlay({ from } as never, graph());
    expect(result.persisted).toBe(true);
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: "tenant_id,project_id,source_table,source_id" });
    const nodePayload = upsert.mock.calls[0][0] as Array<{ family: string; title?: string }>;
    expect(nodePayload.every((row) => row.title === undefined)).toBe(true);
    expect(edgeUpsert.mock.calls[0][0].length).toBeGreaterThan(0);
    expect(edgeUpsert.mock.calls[0][1]).toEqual({
      onConflict: "tenant_id,project_id,kind,from_node_id,to_node_id",
    });
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

  it("does not treat RLS errors as a missing overlay", async () => {
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
    expect(result.reason).not.toBe("overlay_unavailable");
    expect(result.reason).toContain("construction_graph_nodes");
  });

  it("stops after a failed edge delete and does not insert", async () => {
    const upsert = nodeUpsertOk();
    const delEq2 = vi.fn().mockResolvedValue({
      error: { message: 'new row violates row-level security policy for table "construction_graph_edges"' },
    });
    const delEq1 = vi.fn().mockReturnValue({ eq: delEq2 });
    const edgeUpsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "construction_graph_nodes") return { upsert };
      if (table === "construction_graph_edges") return { delete: () => ({ eq: delEq1 }), upsert: edgeUpsert };
      throw new Error(table);
    });
    const result = await persistConstructionGraphOverlay({ from } as never, graph());
    expect(result.persisted).toBe(false);
    expect(result.reason).toContain("construction_graph_edges");
    expect(edgeUpsert).not.toHaveBeenCalled();
  });
});
