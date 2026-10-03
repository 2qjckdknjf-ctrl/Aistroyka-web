import { describe, expect, it } from "vitest";
import { countSubmittedReportsForProject } from "./project-summary.repository";

function createSummaryMock(opts: {
  dayReports?: { id: string }[];
  tasks?: { id: string }[];
  taskReports?: { id: string; day_id: string | null }[];
  otherDays?: { id: string; project_id: string | null }[];
}) {
  return {
    from(table: string) {
      if (table === "worker_reports") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      in(_col: string, ids: string[]) {
                        if (ids.includes("day-this")) {
                          return Promise.resolve({ data: opts.dayReports ?? [], error: null });
                        }
                        return Promise.resolve({ data: opts.taskReports ?? [], error: null });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }
      if (table === "worker_tasks") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return Promise.resolve({ data: opts.tasks ?? [], error: null });
                  },
                };
              },
            };
          },
        };
      }
      if (table === "worker_day") {
        return {
          select() {
            return {
              eq() {
                return {
                  in() {
                    return Promise.resolve({ data: opts.otherDays ?? [], error: null });
                  },
                };
              },
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("countSubmittedReportsForProject", () => {
  it("uses task project when the linked day exists with null project_id", async () => {
    const supabase = createSummaryMock({
      dayReports: [],
      tasks: [{ id: "task-1" }],
      taskReports: [{ id: "rpt-1", day_id: "day-null" }],
      otherDays: [{ id: "day-null", project_id: null }],
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", ["day-this"])
    ).resolves.toBe(1);
  });

  it("does not count a task-linked report whose day belongs to another project", async () => {
    const supabase = createSummaryMock({
      dayReports: [],
      tasks: [{ id: "task-1" }],
      taskReports: [{ id: "rpt-1", day_id: "day-other" }],
      otherDays: [{ id: "day-other", project_id: "proj-other" }],
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", ["day-this"])
    ).resolves.toBe(0);
  });
});
