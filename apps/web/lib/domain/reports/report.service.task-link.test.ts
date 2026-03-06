import { describe, expect, it, vi, beforeEach } from "vitest";
import { createReport, submitReport, validateTaskForReportLink } from "./report.service";
import * as taskRepo from "@/lib/domain/tasks/task.repository";
import { isTaskAssignedTo } from "@/lib/domain/task-assignments";
import * as repo from "./report.repository";

vi.mock("@/lib/domain/tasks/task.repository");
vi.mock("@/lib/domain/task-assignments");
vi.mock("./report.repository");
vi.mock("@/lib/sync/change-log.repository", () => ({ emitChange: vi.fn().mockResolvedValue(1) }));

describe("report.service task link", () => {
  const tenantId = "tenant-1";
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateTaskForReportLink", () => {
    it("returns task_invalid when task not found", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue(null);
      const result = await validateTaskForReportLink({} as any, tenantId, "task-1", userId);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("task_invalid");
    });

    it("returns task_not_assigned when task exists but not assigned to user", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue({ id: "task-1", assigned_to: "other-user", title: "T", status: "pending" } as any);
      vi.mocked(isTaskAssignedTo).mockResolvedValue(false);
      const result = await validateTaskForReportLink({} as any, tenantId, "task-1", userId);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("task_not_assigned");
    });

    it("returns ok when task assigned_to matches user", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue({ id: "task-1", assigned_to: userId, title: "T", status: "pending" } as any);
      const result = await validateTaskForReportLink({} as any, tenantId, "task-1", userId);
      expect(result.ok).toBe(true);
    });

    it("returns ok when task assigned via task_assignments", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue({ id: "task-1", assigned_to: null, title: "T", status: "pending" } as any);
      vi.mocked(isTaskAssignedTo).mockResolvedValue(true);
      const result = await validateTaskForReportLink({} as any, tenantId, "task-1", userId);
      expect(result.ok).toBe(true);
    });
  });

  describe("createReport", () => {
    it("creates report without task_id when not provided", async () => {
      const report = {
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        day_id: null,
        status: "draft",
        created_at: "2025-01-01T00:00:00Z",
        submitted_at: null,
        task_id: null,
      } as any;
      vi.mocked(repo.create).mockResolvedValue(report);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await createReport(supabase, ctx, {});
      expect(result.error).toBe("");
      expect(result.data?.id).toBe("rpt-1");
      expect(result.data?.task_id).toBeNull();
    });

    it("returns code task_invalid when task_id provided but task not found", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue(null);
      const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn() });
      const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await createReport(supabase, ctx, { taskId: "bad-task" });
      expect(result.data).toBeNull();
      expect(result.code).toBe("task_invalid");
      expect(insert).not.toHaveBeenCalled();
    });

    it("returns code task_invalid for cross-tenant task_id (getById returns null)", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue(null);
      const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn() });
      const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await createReport(supabase, ctx, { taskId: "task-in-other-tenant" });
      expect(result.data).toBeNull();
      expect(result.code).toBe("task_invalid");
      expect(taskRepo.getById).toHaveBeenCalledWith(supabase, "task-in-other-tenant", tenantId);
      expect(insert).not.toHaveBeenCalled();
    });

    it("returns code task_not_assigned when task exists but not assigned to user (403)", async () => {
      vi.mocked(taskRepo.getById).mockResolvedValue({ id: "task-1", assigned_to: "other-user", title: "T", status: "pending" } as any);
      vi.mocked(isTaskAssignedTo).mockResolvedValue(false);
      const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn() });
      const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await createReport(supabase, ctx, { taskId: "task-1" });
      expect(result.data).toBeNull();
      expect(result.code).toBe("task_not_assigned");
      expect(insert).not.toHaveBeenCalled();
    });
  });

  describe("submitReport task_id RBAC", () => {
    it("returns code task_not_assigned when options.taskId not assigned to user (403)", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        day_id: null,
        status: "draft",
        created_at: "2025-01-01T00:00:00Z",
        submitted_at: null,
        task_id: null,
      } as any);
      vi.mocked(taskRepo.getById).mockResolvedValue({ id: "task-1", assigned_to: "other-user", title: "T", status: "pending" } as any);
      vi.mocked(isTaskAssignedTo).mockResolvedValue(false);
      const submit = vi.fn().mockResolvedValue({ error: null });
      const supabase = { from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn() }) }) }) }) } as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await submitReport(supabase, ctx, "rpt-1", null, { taskId: "task-1" });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("task_not_assigned");
      expect(repo.submit).not.toHaveBeenCalled();
    });
  });
});
