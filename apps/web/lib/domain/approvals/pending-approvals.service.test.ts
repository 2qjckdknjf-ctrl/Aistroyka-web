import { describe, expect, it } from "vitest";
import {
  listPendingApprovals,
  WORKER_REPORTS_PENDING_SELECT,
} from "./pending-approvals.service";

type QueryResult<T> = Promise<{ data: T[] | null; error: { message: string } | null }>;

function createMockSupabase(opts?: { reportsError?: string; docsError?: string }) {
  return {
    from(table: string) {
      if (table === "worker_reports") {
        return {
          select(columns: string) {
            expect(columns).toBe(WORKER_REPORTS_PENDING_SELECT);
            return {
              eq() {
                return {
                  eq() {
                    return {
                      order() {
                        return {
                          limit(): QueryResult<{
                            id: string;
                            user_id: string;
                            status: string;
                            submitted_at: string | null;
                            task_id: string | null;
                            day_id: string | null;
                          }> {
                            if (opts?.reportsError) {
                              return Promise.resolve({
                                data: null,
                                error: { message: opts.reportsError },
                              });
                            }
                            return Promise.resolve({
                              data: [
                                {
                                  id: "rpt-old",
                                  user_id: "worker-1",
                                  status: "submitted",
                                  submitted_at: "2026-04-17T08:00:00.000Z",
                                  task_id: "task-1",
                                  day_id: null,
                                },
                                {
                                  id: "rpt-new",
                                  user_id: "worker-2",
                                  status: "submitted",
                                  submitted_at: "2026-04-18T09:00:00.000Z",
                                  task_id: null,
                                  day_id: "day-2",
                                },
                              ],
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
      if (table === "project_documents") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      order() {
                        return {
                          limit(): QueryResult<{
                            id: string;
                            project_id: string;
                            title: string;
                            type: "document" | "act" | "contract";
                            status: string;
                            updated_at: string;
                          }> {
                            if (opts?.docsError) {
                              return Promise.resolve({
                                data: null,
                                error: { message: opts.docsError },
                              });
                            }
                            return Promise.resolve({
                              data: [
                                {
                                  id: "doc-mid",
                                  project_id: "proj-3",
                                  title: "Act #17",
                                  type: "act",
                                  status: "under_review",
                                  updated_at: "2026-04-17T12:00:00.000Z",
                                },
                              ],
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
      if (table === "worker_tasks") {
        return {
          select() {
            return {
              eq() {
                return {
                  in(): QueryResult<{ id: string; project_id: string | null }> {
                    return Promise.resolve({
                      data: [{ id: "task-1", project_id: "proj-1" }],
                      error: null,
                    });
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
                  in(): QueryResult<{ id: string; project_id: string | null }> {
                    return Promise.resolve({
                      data: [{ id: "day-2", project_id: "proj-2" }],
                      error: null,
                    });
                  },
                };
              },
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as const;
}

describe("listPendingApprovals", () => {
  it("does not select a nonexistent worker_reports.project_id column", () => {
    expect(WORKER_REPORTS_PENDING_SELECT).toBe("id, user_id, status, submitted_at, task_id, day_id");
    expect(WORKER_REPORTS_PENDING_SELECT.split(",").map((p) => p.trim())).not.toContain("project_id");
  });

  it("returns unified oldest-first queue for reports and documents", async () => {
    const supabase = createMockSupabase();
    const rows = await listPendingApprovals(supabase as never, "tenant-1", 50);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.kind)).toEqual(["report", "document", "report"]);
    expect(rows.map((r) => r.id)).toEqual(["rpt-old", "doc-mid", "rpt-new"]);
    expect(rows[0]).toMatchObject({ kind: "report", project_id: "proj-1" });
    expect(rows[2]).toMatchObject({ kind: "report", project_id: "proj-2" });
  });

  it("does not collapse report query failures to an empty report list", async () => {
    const supabase = createMockSupabase({ reportsError: "column worker_reports.project_id does not exist" });
    await expect(listPendingApprovals(supabase as never, "tenant-1", 50)).rejects.toThrow(
      /project_id does not exist/
    );
  });
});
