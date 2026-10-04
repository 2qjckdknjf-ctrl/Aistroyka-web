import { describe, expect, it, vi } from "vitest";
import {
  CONSTRUCTION_GRAPH_SOURCE_PAGE,
  queryProjectConstructionGraph,
} from "./construction-graph.repository";

function pageResult(rows: unknown[], error: unknown = null) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const order = vi.fn().mockReturnValue({ limit });
  const eq2 = vi.fn().mockReturnValue({ order });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  return { select: vi.fn().mockReturnValue({ eq: eq1 }), limit, order };
}

describe("queryProjectConstructionGraph", () => {
  it("uses user_id and includes day-linked reports", async () => {
    const tables: Record<string, ReturnType<typeof pageResult>> = {
      projects: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "p1", name: "Villa" }, error: null }),
            }),
          }),
        }),
        limit: vi.fn(),
        order: vi.fn(),
      } as never,
      worker_tasks: pageResult([{ id: "t1", title: "Slab", assigned_to: null }]),
      media: pageResult([]),
      project_defects: pageResult([]),
      project_documents: pageResult([]),
      worker_day: pageResult([{ id: "day-1" }]),
    };
    const reportSelect = vi.fn();
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "worker_reports") {
          const limit = vi.fn().mockImplementation(async () => {
            const col = reportSelect.mock.calls.length === 1 ? "task_id" : "day_id";
            if (col === "task_id") {
              return { data: [{ id: "r-task", task_id: "t1", user_id: "u1" }], error: null };
            }
            return { data: [{ id: "r-day", task_id: null, user_id: "u1" }], error: null };
          });
          const order = vi.fn().mockReturnValue({ limit });
          const inn = vi.fn().mockReturnValue({ order });
          reportSelect.mockReturnValue({ in: inn });
          return { select: reportSelect };
        }
        return tables[table];
      }),
    };

    const { graph, error } = await queryProjectConstructionGraph(supabase as never, "ten", "p1");
    expect(error).toBe("");
    expect(graph?.nodes.some((n) => n.source_id === "r-day")).toBe(true);
    expect(graph?.nodes.some((n) => n.source_id === "r-task")).toBe(true);
    expect(reportSelect).toHaveBeenCalledWith("id, task_id, user_id");
  });

  it("propagates a later source-query failure", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "p1", name: "Villa" }, error: null }),
                }),
              }),
            }),
          };
        }
        return pageResult([], { message: "boom" });
      }),
    };
    const { graph, error } = await queryProjectConstructionGraph(supabase as never, "ten", "p1");
    expect(graph).toBeNull();
    expect(error).toBe("boom");
  });

  it("marks truncated when a source page exceeds the bound", async () => {
    const extra = Array.from({ length: CONSTRUCTION_GRAPH_SOURCE_PAGE + 1 }, (_, i) => ({
      id: `task-${i}`,
      title: "T",
      assigned_to: null,
    }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "p1", name: "Villa" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "worker_tasks") return pageResult(extra);
        if (table === "worker_reports") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return pageResult([]);
      }),
    };
    const { graph, error } = await queryProjectConstructionGraph(supabase as never, "ten", "p1");
    expect(error).toBe("");
    expect(graph?.truncated).toBe(true);
    expect(graph?.nodes.filter((n) => n.family === "task")).toHaveLength(CONSTRUCTION_GRAPH_SOURCE_PAGE);
  });

  it("does not turn a malformed source page into graph nodes", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "p1", name: "Villa" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "worker_tasks") return pageResult(["not-a-row"]);
        return pageResult([]);
      }),
    };
    const { graph, error } = await queryProjectConstructionGraph(supabase as never, "ten", "p1");
    expect(graph).toBeNull();
    expect(error).toMatch(/Malformed/);
  });
});
