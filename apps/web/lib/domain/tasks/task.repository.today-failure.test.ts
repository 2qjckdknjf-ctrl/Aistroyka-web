import { describe, expect, it, vi } from "vitest";
import { getAssignedTaskIds } from "@/lib/domain/task-assignments";
import * as repo from "./task.repository";

vi.mock("@/lib/domain/task-assignments", () => ({
  getAssignedTaskIds: vi.fn().mockResolvedValue([]),
}));

describe("task.repository listTasksForUser fail-closed", () => {
  it("throws instead of returning [] when the assigned_to query fails", async () => {
    const failed = {
      eq: () => failed,
      lte: () => failed,
      in: () => failed,
      then: (resolve: (v: { data: null; error: { message: string } }) => void) =>
        Promise.resolve({ data: null, error: { message: "statement timeout" } }).then(resolve),
    };
    const supabase = {
      from: () => ({
        select: () => failed,
      }),
    } as unknown as Parameters<typeof repo.listTasksForUser>[0];
    vi.mocked(getAssignedTaskIds).mockResolvedValue([]);

    await expect(
      repo.listTasksForUser(supabase, "tenant-1", "user-1")
    ).rejects.toThrow("Task list failed");
  });
});
