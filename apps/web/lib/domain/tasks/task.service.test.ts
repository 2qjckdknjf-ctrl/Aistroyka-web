import { describe, expect, it, vi } from "vitest";
import * as taskRepo from "./task.repository";
import * as taskPolicy from "./task.policy";
import * as assignRepo from "@/lib/domain/task-assignments/task-assignments.repository";
import {
  listTasksForToday,
  createTask,
  updateTask,
  assignTask,
  listTasks,
  getTaskById,
} from "./task.service";

vi.mock("@/lib/domain/task-assignments", () => ({
  getAssignedTaskIds: vi.fn().mockResolvedValue([]),
}));

vi.mock("./task.repository", () => ({
  listTasksForUser: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  getById: vi.fn(),
  getByIdWithReports: vi.fn(),
}));

vi.mock("@/lib/domain/task-assignments/task-assignments.repository", () => ({
  assign: vi.fn(),
}));

vi.mock("./task.policy", () => ({
  canReadTasks: vi.fn().mockReturnValue(true),
  canManageTasks: vi.fn().mockReturnValue(true),
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

  it("filters by project_id when provided", async () => {
    vi.mocked(taskPolicy.canReadTasks).mockReturnValue(true);
    vi.mocked(taskRepo.listTasksForUser).mockResolvedValue([
      { id: "task1", title: "T1", status: "pending", project_id: "proj-a" },
      { id: "task2", title: "T2", status: "pending", project_id: "proj-b" },
    ] as any);
    const result = await listTasksForToday(supabase, ctx, "proj-a");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("task1");
    expect(result.data[0].project_id).toBe("proj-a");
  });

  describe("createTask", () => {
    it("returns error when canManageTasks is false", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(false);
      const result = await createTask(supabase, ctx, { project_id: "p1", title: "T" });
      expect(result.error).toBe("Insufficient rights");
      expect(result.data).toBeNull();
    });
    it("returns data when create succeeds", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(true);
      const task = { id: "task1", title: "T", status: "pending", project_id: "p1" };
      vi.mocked(taskRepo.create).mockResolvedValue(task as any);
      const result = await createTask(supabase, ctx, { project_id: "p1", title: "T" });
      expect(result.error).toBe("");
      expect(result.data).toEqual(task);
    });
  });

  describe("updateTask", () => {
    it("returns error when canManageTasks is false", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(false);
      const result = await updateTask(supabase, ctx, "task1", { title: "T2" });
      expect(result.error).toBe("Insufficient rights");
      expect(result.data).toBeNull();
    });
    it("returns data when update succeeds", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(true);
      const task = { id: "task1", title: "T2", status: "pending" };
      vi.mocked(taskRepo.update).mockResolvedValue(task as any);
      const result = await updateTask(supabase, ctx, "task1", { title: "T2" });
      expect(result.error).toBe("");
      expect(result.data).toEqual(task);
    });
  });

  describe("assignTask", () => {
    it("returns error when canManageTasks is false", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(false);
      const result = await assignTask(supabase, ctx, "task1", "worker1");
      expect(result.error).toBe("Insufficient rights");
    });
    it("returns no error when assign succeeds", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(true);
      vi.mocked(assignRepo.assign).mockResolvedValue(true);
      const result = await assignTask(supabase, ctx, "task1", "worker1");
      expect(result.error).toBe("");
    });
  });

  describe("listTasks", () => {
    it("returns error when canManageTasks is false", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(false);
      const result = await listTasks(supabase, ctx, {});
      expect(result.error).toBe("Insufficient rights");
      expect(result.data).toEqual([]);
    });
    it("returns data and total when list succeeds", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(true);
      vi.mocked(taskRepo.list).mockResolvedValue({ data: [{ id: "task1", title: "T" }] as any, total: 1 });
      const result = await listTasks(supabase, ctx, { limit: 10 });
      expect(result.error).toBe("");
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("getTaskById", () => {
    it("returns error when canManageTasks is false", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(false);
      const result = await getTaskById(supabase, ctx, "task1");
      expect(result.error).toBe("Insufficient rights");
      expect(result.data).toBeNull();
    });
    it("returns data when task found", async () => {
      vi.mocked(taskPolicy.canManageTasks).mockReturnValue(true);
      const task = { id: "task1", title: "T", status: "pending" };
      vi.mocked(taskRepo.getByIdWithReports).mockResolvedValue(task as any);
      const result = await getTaskById(supabase, ctx, "task1");
      expect(result.error).toBe("");
      expect(result.data).toEqual(task);
    });
  });
});
