import { describe, expect, it, vi } from "vitest";
import * as taskRepo from "./task.repository";
import * as taskPolicy from "./task.policy";
import { listTasksForToday } from "./task.service";

vi.mock("./task.repository", () => ({
  listTasksForUser: vi.fn(),
}));

vi.mock("./task.policy", () => ({
  canReadTasks: vi.fn().mockReturnValue(true),
  canManageTasks: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/domain/reports/report.service", () => ({
  validateTaskForReportLink: vi.fn(),
}));

vi.mock("@/lib/domain/task-assignments/task-assignments.repository", () => ({
  assign: vi.fn(),
}));

describe("task.service Today fail-closed", () => {
  it("does not collapse a query failure into an empty success snapshot", async () => {
    vi.mocked(taskPolicy.canReadTasks).mockReturnValue(true);
    vi.mocked(taskRepo.listTasksForUser).mockRejectedValue(new Error("Task list failed"));
    const result = await listTasksForToday({} as never, {
      tenantId: "t1",
      userId: "u1",
      role: "member",
      subscriptionTier: "free",
      clientProfile: "ios_worker",
      traceId: "trace",
    });

    expect(result.data).toEqual([]);
    expect(result.error).toBe("Task list failed");
  });
});
