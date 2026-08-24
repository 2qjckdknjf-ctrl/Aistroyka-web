import { describe, expect, it, vi, beforeEach } from "vitest";
import { addMediaToReport, createReport, submitReport, validateTaskForReportLink } from "./report.service";
import * as taskRepo from "@/lib/domain/tasks/task.repository";
import { isTaskAssignedTo } from "@/lib/domain/task-assignments";
import * as repo from "./report.repository";
import * as uploadSessionRepo from "@/lib/domain/upload-session/upload-session.repository";
import * as mediaRepo from "@/lib/domain/media/media.repository";

vi.mock("@/lib/domain/tasks/task.repository");
vi.mock("@/lib/domain/task-assignments");
vi.mock("./report.repository");
vi.mock("@/lib/domain/upload-session/upload-session.repository");
vi.mock("@/lib/domain/media/media.repository");
vi.mock("@/lib/sync/change-log.repository", () => ({ emitChange: vi.fn().mockResolvedValue(1) }));
vi.mock("@/lib/observability/audit.service", () => ({ emitAudit: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/platform/jobs/job.service", () => ({ enqueueJob: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn().mockResolvedValue(undefined),
  notifyTenantManagers: vi.fn().mockResolvedValue(undefined),
}));

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

    it("returns proof_required when report has no media rows", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        day_id: null,
        status: "draft",
        created_at: "2025-01-01T00:00:00Z",
        submitted_at: null,
        task_id: "task-1",
      } as any);
      vi.mocked(repo.listMediaByReportId).mockResolvedValue([]);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await submitReport(supabase, ctx, "rpt-1", null, {});
      expect(result.ok).toBe(false);
      expect(result.code).toBe("proof_required");
      expect(repo.submit).not.toHaveBeenCalled();
    });

    it("resubmits when report is in changes_requested status", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        day_id: null,
        status: "changes_requested",
        created_at: "2025-01-01T00:00:00Z",
        submitted_at: null,
        task_id: "task-1",
      } as any);
      vi.mocked(repo.listMediaByReportId).mockResolvedValue([{ media_id: "m1", upload_session_id: null }]);
      vi.mocked(mediaRepo.getById).mockResolvedValue({
        id: "m1",
        project_id: "p1",
        tenant_id: tenantId,
        type: "photo",
        file_url: "https://example.com/m1.jpg",
      } as any);
      vi.mocked(repo.getProjectIdForReport).mockResolvedValue(null);
      vi.mocked(repo.resubmit).mockResolvedValue(true);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await submitReport(supabase, ctx, "rpt-1", null, { workerNote: "updated" });
      expect(result.ok).toBe(true);
      expect(repo.resubmit).toHaveBeenCalledWith(
        supabase,
        "rpt-1",
        tenantId,
        "task-1",
        "updated"
      );
      expect(repo.submit).not.toHaveBeenCalled();
    });

    it("returns proof_required when upload_session_id is fabricated", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        day_id: null,
        status: "draft",
        created_at: "2025-01-01T00:00:00Z",
        submitted_at: null,
        task_id: "task-1",
      } as any);
      vi.mocked(repo.listMediaByReportId).mockResolvedValue([
        { media_id: null, upload_session_id: "00000000-0000-4000-8000-000000000099" },
      ]);
      vi.mocked(uploadSessionRepo.getById).mockResolvedValue(null);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await submitReport(supabase, ctx, "rpt-1", null, {});
      expect(result.ok).toBe(false);
      expect(result.code).toBe("proof_required");
      expect(repo.submit).not.toHaveBeenCalled();
    });
  });

  describe("addMediaToReport proof validation", () => {
    it("rejects nonexistent upload_session_id", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        status: "draft",
      } as any);
      vi.mocked(uploadSessionRepo.getById).mockResolvedValue(null);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await addMediaToReport(supabase, ctx, "rpt-1", {
        uploadSessionId: "00000000-0000-4000-8000-000000000099",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid photo proof");
      expect(repo.addMedia).not.toHaveBeenCalled();
    });

    it("accepts finalized report_before session owned by the worker", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        status: "draft",
      } as any);
      vi.mocked(uploadSessionRepo.getById).mockResolvedValue({
        id: "sess-1",
        tenant_id: tenantId,
        user_id: userId,
        purpose: "report_before",
        status: "finalized",
        object_path: `${tenantId}/${userId}/report_before/x.jpg`,
        mime_type: "image/jpeg",
        size_bytes: 1200,
        created_at: "2025-01-01T00:00:00Z",
        expires_at: "2025-01-01T01:00:00Z",
      } as any);
      vi.mocked(repo.addMedia).mockResolvedValue(true);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await addMediaToReport(supabase, ctx, "rpt-1", { uploadSessionId: "sess-1" });
      expect(result.ok).toBe(true);
      expect(repo.addMedia).toHaveBeenCalledWith(supabase, "rpt-1", { uploadSessionId: "sess-1" });
    });

    it("rejects task_chat purpose sessions for report proof", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "rpt-1",
        tenant_id: tenantId,
        user_id: userId,
        status: "draft",
      } as any);
      vi.mocked(uploadSessionRepo.getById).mockResolvedValue({
        id: "sess-chat",
        tenant_id: tenantId,
        user_id: userId,
        purpose: "task_chat",
        status: "finalized",
        object_path: `${tenantId}/${userId}/task_chat/x.jpg`,
        mime_type: "image/jpeg",
        size_bytes: 1200,
        created_at: "2025-01-01T00:00:00Z",
        expires_at: "2025-01-01T01:00:00Z",
      } as any);
      const supabase = {} as any;
      const ctx = { tenantId, userId, role: "member" } as any;
      const result = await addMediaToReport(supabase, ctx, "rpt-1", { uploadSessionId: "sess-chat" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid photo proof");
      expect(repo.addMedia).not.toHaveBeenCalled();
    });
  });
});
