import { describe, expect, it } from "vitest";
import {
  chunkIds,
  countSubmittedReportsForProject,
  PROJECT_SUMMARY_ID_PAGE_SIZE,
} from "./project-summary.repository";

type TaskReport = { id: string; day_id: string | null; task_id: string };

function pageRows<T extends { id: string }>(rows: T[], from: number, to: number): T[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id)).slice(from, to + 1);
}

function createSummaryMock(opts: {
  dayReports?: { id: string }[];
  tasks?: { id: string }[];
  taskReports?: TaskReport[];
  otherDays?: { id: string; project_id: string | null }[];
  failTaskChunk?: string;
  failTaskReportPageFrom?: number;
}) {
  const tasks = [...(opts.tasks ?? [])].sort((a, b) => a.id.localeCompare(b.id));
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
                      in(col: string, ids: string[]) {
                        return {
                          order() {
                            return {
                              range(from: number, to: number) {
                                if (opts.failTaskChunk && col === "task_id" && ids.includes(opts.failTaskChunk)) {
                                  return Promise.resolve({ data: null, error: { message: "timeout" } });
                                }
                                if (
                                  opts.failTaskReportPageFrom !== undefined &&
                                  col === "task_id" &&
                                  from >= opts.failTaskReportPageFrom
                                ) {
                                  return Promise.resolve({ data: null, error: { message: "timeout" } });
                                }
                                if (col === "day_id") {
                                  const data = ids.includes("day-this") ? opts.dayReports ?? [] : [];
                                  return Promise.resolve({ data: pageRows(data, from, to), error: null });
                                }
                                const data = (opts.taskReports ?? []).filter((row) => ids.includes(row.task_id));
                                return Promise.resolve({ data: pageRows(data, from, to), error: null });
                              },
                            };
                          },
                        };
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
                    return {
                      order() {
                        return {
                          range(from: number, to: number) {
                            return Promise.resolve({
                              data: tasks.slice(from, to + 1),
                              error: null,
                            });
                          },
                        };
                      },
                    };
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
                    return {
                      order() {
                        return {
                          range(from: number, to: number) {
                            return Promise.resolve({ data: pageRows(opts.otherDays ?? [], from, to), error: null });
                          },
                        };
                      },
                    };
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

describe("chunkIds", () => {
  it("splits into bounded disjoint pages", () => {
    const ids = Array.from({ length: PROJECT_SUMMARY_ID_PAGE_SIZE + 1 }, (_, i) => `t-${i}`);
    const chunks = chunkIds(ids);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(PROJECT_SUMMARY_ID_PAGE_SIZE);
    expect(chunks[1]).toEqual([`t-${PROJECT_SUMMARY_ID_PAGE_SIZE}`]);
    expect(new Set(chunks.flat()).size).toBe(ids.length);
  });
});

describe("countSubmittedReportsForProject", () => {
  it("uses task project when the linked day exists with null project_id", async () => {
    const supabase = createSummaryMock({
      dayReports: [],
      tasks: [{ id: "task-1" }],
      taskReports: [{ id: "rpt-1", day_id: "day-null", task_id: "task-1" }],
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
      taskReports: [{ id: "rpt-1", day_id: "day-other", task_id: "task-1" }],
      otherDays: [{ id: "day-other", project_id: "proj-other" }],
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", ["day-this"])
    ).resolves.toBe(0);
  });

  it("counts a submitted report whose task is past the first page", async () => {
    const tasks = Array.from({ length: PROJECT_SUMMARY_ID_PAGE_SIZE + 1 }, (_, i) => ({
      id: `task-${String(i).padStart(4, "0")}`,
    }));
    const lateTask = tasks[PROJECT_SUMMARY_ID_PAGE_SIZE]!.id;
    const supabase = createSummaryMock({
      tasks,
      taskReports: [
        { id: "rpt-first", day_id: null, task_id: tasks[0]!.id },
        { id: "rpt-late", day_id: null, task_id: lateTask },
        { id: "rpt-late", day_id: null, task_id: lateTask },
      ],
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", [])
    ).resolves.toBe(2);
  });

  it("counts submitted task reports past the first result page", async () => {
    const taskReports = Array.from({ length: PROJECT_SUMMARY_ID_PAGE_SIZE + 1 }, (_, i) => ({
      id: `rpt-${String(i).padStart(4, "0")}`,
      day_id: null,
      task_id: "task-1",
    }));
    const supabase = createSummaryMock({
      tasks: [{ id: "task-1" }],
      taskReports,
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", [])
    ).resolves.toBe(PROJECT_SUMMARY_ID_PAGE_SIZE + 1);
  });

  it("does not return a partial count when a later task chunk fails", async () => {
    const tasks = Array.from({ length: PROJECT_SUMMARY_ID_PAGE_SIZE + 1 }, (_, i) => ({
      id: `task-${String(i).padStart(4, "0")}`,
    }));
    const lateTask = tasks[PROJECT_SUMMARY_ID_PAGE_SIZE]!.id;
    const supabase = createSummaryMock({
      tasks,
      taskReports: [{ id: "rpt-first", day_id: null, task_id: tasks[0]!.id }],
      failTaskChunk: lateTask,
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", [])
    ).rejects.toThrow("Pending report count failed");
  });

  it("does not return a partial count when a later report page fails", async () => {
    const taskReports = Array.from({ length: PROJECT_SUMMARY_ID_PAGE_SIZE + 1 }, (_, i) => ({
      id: `rpt-${String(i).padStart(4, "0")}`,
      day_id: null,
      task_id: "task-1",
    }));
    const supabase = createSummaryMock({
      tasks: [{ id: "task-1" }],
      taskReports,
      failTaskReportPageFrom: PROJECT_SUMMARY_ID_PAGE_SIZE,
    });
    await expect(
      countSubmittedReportsForProject(supabase as never, "tenant-1", "proj-task", [])
    ).rejects.toThrow("Pending report count failed");
  });
});
