import { describe, expect, it, vi } from "vitest";
import * as taskRepo from "./task.repository";
import * as taskPolicy from "./task.policy";
import { listTasksForToday } from "./task.service";

vi.mock("@/lib/domain/task-assignments", () => ({
  getAssignedTaskIds: vi.fn().mockResolvedValue([]),
}));

vi.mock("./task.repository", () => ({
  listTasksForUser: vi.fn().mockResolvedValue([]),
}));

vi.mock("./task.policy", () => ({
  canReadTasks: vi.fn().mockReturnValue(true),
}));

describe("task.service", () => {
  const supabase = {} as any;
  const ctx = {
    tenantId: "t1",
    userId: "u1",
    role: "member" as const,
    subscriptionTier: "free",
    clientProfile: "web" as const,
    traceId: "trace",
  };

  it("returns error when canReadTasks is false", async () => {
    vi.mocked(taskPolicy.canReadTasks).mockReturnValue(false);
    const result = await listTasksForToday(supabase, ctx);
    expect(result.error).toBe("Insufficient rights");
    expect(result.data).toEqual([]);
  });

  it("calls listTasksForUser with tenant and user when canReadTasks is true", async () => {
    vi.mocked(taskPolicy.canReadTasks).mockReturnValue(true);
    vi.mocked(taskRepo.listTasksForUser).mockResolvedValue([
      { id: "task1", title: "T1", status: "pending", project_id: null },
    ] as any);
    const result = await listTasksForToday(supabase, ctx);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(taskRepo.listTasksForUser).toHaveBeenCalledWith(supabase, "t1", "u1");
  });
});
