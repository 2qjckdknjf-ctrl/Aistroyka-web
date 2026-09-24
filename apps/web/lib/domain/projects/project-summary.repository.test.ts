import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { countSubmittedReportsForProject } from "./project-summary.repository";

type QueryResult = { data: unknown; error: { message: string } | null };

function thenable(result: QueryResult) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = self;
  chain.eq = self;
  chain.in = self;
  chain.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function mockSupabase(queues: Record<string, QueryResult[]>, selects: string[]) {
  return {
    from(table: string) {
      return {
        select(columns: string) {
          selects.push(`${table}:${columns}`);
          const queue = queues[table] ?? [];
          const next = queue.shift() ?? { data: [], error: null };
          return thenable(next);
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("countSubmittedReportsForProject", () => {
  it("counts submitted reports via the project day or task, not worker_reports.project_id", async () => {
    const selects: string[] = [];
    const supabase = mockSupabase(
      {
        worker_reports: [
          { data: [{ id: "day-report" }], error: null },
          {
            data: [
              { id: "day-report", day_id: "day-1" },
              { id: "task-report", day_id: null },
            ],
            error: null,
          },
        ],
        worker_tasks: [{ data: [{ id: "task-1" }], error: null }],
      },
      selects
    );

    const count = await countSubmittedReportsForProject(supabase, "tenant-1", "project-1", ["day-1"]);

    expect(count).toBe(2);
    expect(selects.filter((entry) => entry.startsWith("worker_reports:"))).toEqual([
      "worker_reports:id",
      "worker_reports:id, day_id",
    ]);
    expect(selects.join("\n")).not.toContain("project_id");
  });

  it("does not count a task-linked report whose day belongs to another project", async () => {
    const supabase = mockSupabase(
      {
        worker_tasks: [{ data: [{ id: "task-1" }], error: null }],
        worker_reports: [{ data: [{ id: "report-1", day_id: "day-other" }], error: null }],
        worker_day: [{ data: [{ id: "day-other", project_id: "project-2" }], error: null }],
      },
      []
    );

    const count = await countSubmittedReportsForProject(supabase, "tenant-1", "project-1", []);

    expect(count).toBe(0);
  });

  it("does not fall through to the task when the day exists without a project", async () => {
    const supabase = mockSupabase(
      {
        worker_tasks: [{ data: [{ id: "task-1" }], error: null }],
        worker_reports: [{ data: [{ id: "report-1", day_id: "day-blank" }], error: null }],
        worker_day: [{ data: [{ id: "day-blank", project_id: null }], error: null }],
      },
      []
    );

    const count = await countSubmittedReportsForProject(supabase, "tenant-1", "project-1", []);

    expect(count).toBe(0);
  });

  it("uses the task project when the day row cannot be resolved", async () => {
    const supabase = mockSupabase(
      {
        worker_tasks: [{ data: [{ id: "task-1" }], error: null }],
        worker_reports: [{ data: [{ id: "report-1", day_id: "day-missing" }], error: null }],
        worker_day: [{ data: [], error: null }],
      },
      []
    );

    const count = await countSubmittedReportsForProject(supabase, "tenant-1", "project-1", []);

    expect(count).toBe(1);
  });

  it("throws instead of reporting zero when the report query fails", async () => {
    const supabase = mockSupabase(
      {
        worker_reports: [{ data: null, error: { message: "column worker_reports.project_id does not exist" } }],
      },
      []
    );

    await expect(
      countSubmittedReportsForProject(supabase, "tenant-1", "project-1", ["day-1"])
    ).rejects.toThrow("Pending report count failed");
  });
});
