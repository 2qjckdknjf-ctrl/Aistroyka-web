import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTaskMessage,
  listTaskMessages,
  softDeleteTaskMessage,
} from "./task-messages.service";

vi.mock("@/lib/domain/tasks/task.repository", () => ({
  getById: vi.fn(),
}));

vi.mock("@/lib/domain/projects/project-access", () => ({
  getProjectMembership: vi.fn(),
}));

vi.mock("@/lib/domain/reports/report.service", () => ({
  validateTaskForReportLink: vi.fn(),
}));

vi.mock("./task-messages.repository", () => ({
  listByTask: vi.fn(),
  getByClientId: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  softDelete: vi.fn(),
  getFinalizedUploadSession: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/platform/push/push.service", () => ({
  enqueuePushToUser: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(),
  notifyTenantManagers: vi.fn(),
}));

import * as taskRepo from "@/lib/domain/tasks/task.repository";
import { getProjectMembership } from "@/lib/domain/projects/project-access";
import { validateTaskForReportLink } from "@/lib/domain/reports/report.service";
import * as repo from "./task-messages.repository";

const ctx = {
  tenantId: "t1",
  userId: "u-worker",
  role: "member",
  clientProfile: "web",
} as any;
const supabase = {} as any;

describe("task-messages.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjectMembership).mockResolvedValue({
      role: "manager",
      source: "project_members",
    });
    vi.mocked(taskRepo.getById).mockResolvedValue({
      id: "task-1",
      project_id: "p1",
      title: "T",
      status: "pending",
      assigned_to: "u-worker",
    } as any);
  });

  it("lists messages for assigned worker", async () => {
    vi.mocked(getProjectMembership).mockResolvedValue(null);
    vi.mocked(validateTaskForReportLink).mockResolvedValue({ ok: true });
    vi.mocked(repo.listByTask).mockResolvedValue({
      data: [
        {
          id: "m1",
          tenant_id: "t1",
          project_id: "p1",
          task_id: "task-1",
          sender_user_id: "u-worker",
          kind: "text",
          body: "hi",
          upload_session_id: null,
          duration_ms: null,
          client_id: null,
          created_at: "2026-07-18T10:00:00Z",
          edited_at: null,
          deleted_at: null,
        },
      ],
      nextCursor: null,
    });
    const res = await listTaskMessages(supabase, ctx, "task-1");
    expect(res.status).toBe(200);
    expect(res.result?.data).toHaveLength(1);
  });

  it("allows an active project manager without task assignment", async () => {
    vi.mocked(repo.listByTask).mockResolvedValue({ data: [], nextCursor: null });

    const res = await listTaskMessages(supabase, ctx, "task-other");

    expect(res.status).toBe(200);
    expect(validateTaskForReportLink).not.toHaveBeenCalled();
  });

  it("allows a tenant admin regardless of client profile", async () => {
    vi.mocked(getProjectMembership).mockResolvedValue(null);
    vi.mocked(repo.listByTask).mockResolvedValue({ data: [], nextCursor: null });
    const adminCtx = { ...ctx, role: "admin", clientProfile: "ios_lite" };

    const res = await listTaskMessages(supabase, adminCtx, "task-other");

    expect(res.status).toBe(200);
    expect(getProjectMembership).not.toHaveBeenCalled();
    expect(validateTaskForReportLink).not.toHaveBeenCalled();
  });

  it("rejects create when worker not assigned", async () => {
    vi.mocked(getProjectMembership).mockResolvedValue(null);
    vi.mocked(validateTaskForReportLink).mockResolvedValue({ ok: false, code: "task_not_assigned" });
    const res = await createTaskMessage(supabase, ctx, "task-1", {
      kind: "text",
      body: "x",
    });
    expect(res.status).toBe(403);
    expect(res.code).toBe("task_not_assigned");
  });

  it("idempotent create via clientId", async () => {
    const existing = {
      id: "m1",
      tenant_id: "t1",
      project_id: "p1",
      task_id: "task-1",
      sender_user_id: "u-worker",
      kind: "text" as const,
      body: "hi",
      upload_session_id: null,
      duration_ms: null,
      client_id: "c1",
      created_at: "2026-07-18T10:00:00Z",
      edited_at: null,
      deleted_at: null,
    };
    vi.mocked(repo.getByClientId).mockResolvedValue(existing);
    const res = await createTaskMessage(supabase, ctx, "task-1", {
      kind: "text",
      body: "hi",
      clientId: "c1",
    });
    expect(res.status).toBe(200);
    expect(res.data?.id).toBe("m1");
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it("soft-delete is idempotent when already deleted", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "m1",
      tenant_id: "t1",
      project_id: "p1",
      task_id: "task-1",
      sender_user_id: "u-worker",
      kind: "text",
      body: "hi",
      upload_session_id: null,
      duration_ms: null,
      client_id: null,
      created_at: "2026-07-18T10:00:00Z",
      edited_at: null,
      deleted_at: "2026-07-18T11:00:00Z",
    });
    const res = await softDeleteTaskMessage(supabase, ctx, "task-1", "m1");
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it("member without manager project role still requires assignment", async () => {
    vi.mocked(getProjectMembership).mockResolvedValue({
      role: "internal_member",
      source: "project_members",
    });
    vi.mocked(validateTaskForReportLink).mockResolvedValue({ ok: false, code: "task_not_assigned" });
    const res = await listTaskMessages(supabase, ctx, "task-other");
    expect(res.status).toBe(403);
    expect(res.code).toBe("task_not_assigned");
    expect(validateTaskForReportLink).toHaveBeenCalled();
  });

  it("assigned member cannot soft-delete another sender's message", async () => {
    vi.mocked(getProjectMembership).mockResolvedValue({
      role: "internal_member",
      source: "project_members",
    });
    vi.mocked(validateTaskForReportLink).mockResolvedValue({ ok: true });
    vi.mocked(repo.getById).mockResolvedValue({
      id: "m-manager",
      tenant_id: "t1",
      project_id: "p1",
      task_id: "task-1",
      sender_user_id: "u-manager",
      kind: "text",
      body: "manager message",
      upload_session_id: null,
      duration_ms: null,
      client_id: null,
      created_at: "2026-07-18T10:00:00Z",
      edited_at: null,
      deleted_at: null,
    });

    const res = await softDeleteTaskMessage(supabase, ctx, "task-1", "m-manager");

    expect(res.status).toBe(403);
    expect(res.ok).toBe(false);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it("rejects media when size_bytes missing", async () => {
    vi.mocked(repo.getFinalizedUploadSession).mockResolvedValue({
      id: "s1",
      purpose: "task_chat",
      mime_type: "image/jpeg",
      size_bytes: null,
      object_path: "media/x.jpg",
      status: "finalized",
    } as any);
    const res = await createTaskMessage(supabase, ctx, "task-1", {
      kind: "image",
      mediaId: "s1",
    });
    expect(res.status).toBe(400);
    expect(res.code).toBe("media_size");
  });

  it("rejects project_media purpose for chat attach", async () => {
    vi.mocked(repo.getFinalizedUploadSession).mockResolvedValue({
      id: "s1",
      purpose: "project_media",
      mime_type: "image/jpeg",
      size_bytes: 1000,
      object_path: "media/x.jpg",
      status: "finalized",
    } as any);
    const res = await createTaskMessage(supabase, ctx, "task-1", {
      kind: "image",
      mediaId: "s1",
    });
    expect(res.status).toBe(400);
    expect(res.code).toBe("media_purpose");
  });
});
