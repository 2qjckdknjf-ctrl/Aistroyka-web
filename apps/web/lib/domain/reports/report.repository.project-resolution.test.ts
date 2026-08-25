import { describe, expect, it, vi } from "vitest";
import { getProjectIdForReport } from "./report.repository";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("getProjectIdForReport", () => {
  it("resolves project via task_id only", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { project_id: "project-from-task" } }));
    const supabase = {
      from: vi.fn((table: string) => {
        expect(table).toBe("worker_tasks");
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle }),
            }),
          }),
        };
      }),
    } as unknown as SupabaseClient;

    const projectId = await getProjectIdForReport(supabase, "tenant-1", {
      task_id: "task-1",
      day_id: "day-1",
    });

    expect(projectId).toBe("project-from-task");
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith("worker_tasks");
  });

  it("returns null for day-only reports without task_id", async () => {
    const supabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;

    const projectId = await getProjectIdForReport(supabase, "tenant-1", {
      task_id: null,
      day_id: "day-1",
    });

    expect(projectId).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
