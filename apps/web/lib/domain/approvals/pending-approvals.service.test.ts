import { describe, expect, it } from "vitest";
import { listPendingApprovals } from "./pending-approvals.service";

type QueryResult<T> = Promise<{ data: T[] | null; error: null }>;

function createMockSupabase() {
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
                      order() {
                        return {
                          limit(): QueryResult<{
                            id: string;
                            user_id: string;
                            status: string;
                            submitted_at: string | null;
                            project_id: string | null;
                          }> {
                            return Promise.resolve({
                              data: [
                                {
                                  id: "rpt-old",
                                  user_id: "worker-1",
                                  status: "submitted",
                                  submitted_at: "2026-04-17T08:00:00.000Z",
                                  project_id: "proj-1",
                                },
                                {
                                  id: "rpt-new",
                                  user_id: "worker-2",
                                  status: "submitted",
                                  submitted_at: "2026-04-18T09:00:00.000Z",
                                  project_id: "proj-2",
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
      throw new Error(`Unexpected table: ${table}`);
    },
  } as const;
}

describe("listPendingApprovals", () => {
  it("returns unified oldest-first queue for reports and documents", async () => {
    const supabase = createMockSupabase();
    const rows = await listPendingApprovals(supabase as never, "tenant-1", 50);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.kind)).toEqual(["report", "document", "report"]);
    expect(rows.map((r) => r.id)).toEqual(["rpt-old", "doc-mid", "rpt-new"]);
  });
});
