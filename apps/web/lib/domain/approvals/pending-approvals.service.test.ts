import { describe, expect, it, vi } from "vitest";
import { listPendingApprovals } from "./pending-approvals.service";

const listReportsByStatusesForManager = vi.fn();

vi.mock("@/lib/domain/reports/report-list.repository", () => ({
  listReportsByStatusesForManager: (...args: unknown[]) =>
    listReportsByStatusesForManager(...args),
}));

type QueryResult<T> = Promise<{ data: T[] | null; error: null }>;

function createMockSupabase() {
  return {
    from(table: string) {
      if (table === "project_documents") {
        return {
          select() {
            return {
              eq() {
                return {
                  in() {
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
                                {
                                  id: "doc-cr",
                                  project_id: "proj-4",
                                  title: "Contract v2",
                                  type: "contract",
                                  status: "changes_requested",
                                  updated_at: "2026-04-18T10:00:00.000Z",
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
    listReportsByStatusesForManager.mockImplementation(
      (_supabase: unknown, _tenantId: string, statuses: string[]) => {
        if (statuses.includes("submitted")) {
          return Promise.resolve([
            {
              id: "rpt-old",
              user_id: "worker-1",
              status: "submitted",
              submitted_at: "2026-04-17T08:00:00.000Z",
              project_id: "proj-1",
              created_at: "2026-04-17T07:00:00.000Z",
              day_id: null,
              task_id: "task-1",
            },
            {
              id: "rpt-new",
              user_id: "worker-2",
              status: "submitted",
              submitted_at: "2026-04-18T09:00:00.000Z",
              project_id: "proj-2",
              created_at: "2026-04-18T08:00:00.000Z",
              day_id: null,
              task_id: "task-2",
            },
          ]);
        }
        return Promise.resolve([
          {
            id: "rpt-cr",
            user_id: "worker-3",
            status: "changes_requested",
            submitted_at: "2026-04-16T08:00:00.000Z",
            reviewed_at: "2026-04-16T12:00:00.000Z",
            project_id: "proj-5",
            created_at: "2026-04-16T07:00:00.000Z",
            day_id: null,
            task_id: "task-3",
            manager_note: "Fix photo",
          },
        ]);
      }
    );

    const supabase = createMockSupabase();
    const rows = await listPendingApprovals(supabase as never, "tenant-1", 50);

    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.id)).toEqual([
      "rpt-cr",
      "rpt-old",
      "doc-mid",
      "rpt-new",
      "doc-cr",
    ]);
    expect(rows.find((r) => r.id === "doc-cr")?.queue).toBe("follow_up");
    expect(rows.find((r) => r.id === "rpt-new")?.queue).toBe("approval");
  });
});
