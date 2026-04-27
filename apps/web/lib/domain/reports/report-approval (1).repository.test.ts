import { describe, it, expect, vi } from "vitest";
import { countSubmittedReportsForProject, insertReportApprovalEvent } from "./report-approval.repository";

describe("report-approval.repository", () => {
  it("insertReportApprovalEvent returns true on success", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
    const ok = await insertReportApprovalEvent(supabase, "t1", "r1", "approved", "u1", "ok");
    expect(ok).toBe(true);
    expect(insert).toHaveBeenCalled();
  });

  it("countSubmittedReportsForProject returns 0 when no tasks or days for project", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })),
    } as any;
    const n = await countSubmittedReportsForProject(supabase, "proj-1", "tenant-1");
    expect(n).toBe(0);
    expect(supabase.from).toHaveBeenCalledWith("worker_tasks");
    expect(supabase.from).toHaveBeenCalledWith("worker_day");
  });

  it("countSubmittedReportsForProject dedupes reports linked via task or day", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "worker_tasks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [{ id: "task-a" }], error: null }),
              }),
            }),
          };
        }
        if (table === "worker_day") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "worker_reports") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockResolvedValue({ data: [{ id: "rep-1" }], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    } as any;
    const n = await countSubmittedReportsForProject(supabase, "proj-1", "tenant-1");
    expect(n).toBe(1);
  });
});
