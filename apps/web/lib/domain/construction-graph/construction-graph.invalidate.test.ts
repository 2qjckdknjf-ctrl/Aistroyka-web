import { describe, expect, it, vi } from "vitest";
import { invalidateConstructionGraphForSource } from "./construction-graph.repository";

/** Thenable eq-chain: await after 3 eqs (no project) or after a 4th eq (with project). */
function chainEqs(final: unknown) {
  const eqProject = vi.fn().mockResolvedValue(final);
  const eqSourceId = vi.fn().mockImplementation(() => ({
    eq: eqProject,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(final).then(resolve, reject),
  }));
  const eqSourceTable = vi.fn().mockReturnValue({ eq: eqSourceId });
  const eqTenant = vi.fn().mockReturnValue({ eq: eqSourceTable });
  return { eqTenant };
}

describe("invalidateConstructionGraphForSource", () => {
  it("returns invalidated with zero removals when no overlay nodes match", async () => {
    const { eqTenant } = chainEqs({ data: [], error: null });
    const from = vi.fn((table: string) => {
      if (table === "construction_graph_nodes") {
        return { select: () => ({ eq: eqTenant }) };
      }
      throw new Error(table);
    });

    const result = await invalidateConstructionGraphForSource({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      sourceTable: "ai_analysis",
      sourceId: "a1",
    });
    expect(result).toEqual({ invalidated: true, removedNodes: 0 });
  });

  it("deletes edges then nodes for a revoked source", async () => {
    const { eqTenant } = chainEqs({
      data: [{ id: "n-a", project_id: "p1" }],
      error: null,
    });

    const edgeInCalls: Array<[string, string[]]> = [];
    const edgeIn = vi.fn((column: string, ids: string[]) => {
      edgeInCalls.push([column, ids]);
      return Promise.resolve({ error: null });
    });
    const edgeEq2 = vi.fn().mockReturnValue({ in: edgeIn });
    const edgeEq1 = vi.fn().mockReturnValue({ eq: edgeEq2 });
    const edgeDelete = vi.fn().mockReturnValue({ eq: edgeEq1 });

    const nodeDeleteResolve = vi.fn().mockResolvedValue({ error: null });
    const nodeIn = vi.fn().mockReturnValue({ eq: nodeDeleteResolve });
    const nodeDeleteEq = vi.fn().mockReturnValue({ in: nodeIn });
    const nodeDelete = vi.fn().mockReturnValue({ eq: nodeDeleteEq });

    const from = vi.fn((table: string) => {
      if (table === "construction_graph_nodes") {
        return {
          select: () => ({ eq: eqTenant }),
          delete: nodeDelete,
        };
      }
      if (table === "construction_graph_edges") {
        return { delete: edgeDelete };
      }
      throw new Error(table);
    });

    const result = await invalidateConstructionGraphForSource({ from } as never, {
      tenantId: "t1",
      projectId: "p1",
      sourceTable: "ai_analysis",
      sourceId: "a1",
    });

    expect(result).toEqual({ invalidated: true, removedNodes: 1 });
    expect(edgeDelete).toHaveBeenCalledTimes(2);
    expect(edgeInCalls).toEqual([
      ["from_node_id", ["n-a"]],
      ["to_node_id", ["n-a"]],
    ]);
    expect(nodeDelete).toHaveBeenCalled();
  });

  it("treats missing overlay tables as non-fatal", async () => {
    const { eqTenant } = chainEqs({
      data: null,
      error: { message: 'relation "construction_graph_nodes" does not exist' },
    });
    const from = vi.fn(() => ({
      select: () => ({ eq: eqTenant }),
    }));

    const result = await invalidateConstructionGraphForSource({ from } as never, {
      tenantId: "t1",
      sourceTable: "media",
      sourceId: "m1",
    });
    expect(result).toEqual({
      invalidated: false,
      removedNodes: 0,
      reason: "overlay_unavailable",
    });
  });

  it("rejects empty refs", async () => {
    const result = await invalidateConstructionGraphForSource({ from: vi.fn() } as never, {
      tenantId: " ",
      sourceTable: "media",
      sourceId: "m1",
    });
    expect(result).toEqual({ invalidated: false, removedNodes: 0, reason: "invalid_ref" });
  });
});
