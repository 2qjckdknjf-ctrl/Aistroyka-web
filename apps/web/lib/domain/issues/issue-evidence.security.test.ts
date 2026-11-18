import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createWorkerReportedIssue, updateWorkerReportedIssue } from "./issue.service";

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canReadProjects: vi.fn(() => true),
  canManageProjects: vi.fn(() => true),
}));

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(() => Promise.resolve({ id: "p1", tenant_id: "t1" })),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(() => Promise.resolve()),
  notifyUser: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/domain/tasks/task.repository", () => ({
  getById: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/domain/upload-session/upload-session.repository", () => ({
  getById: vi.fn(),
}));

vi.mock("./issue.repository", () => ({
  listByProject: vi.fn(() => Promise.resolve([])),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  attachEvidenceUrls: vi.fn(async (_supabase: unknown, issues: unknown[]) => issues),
}));

const supabase = {} as SupabaseClient;
const ctx = {
  tenantId: "t1",
  userId: "u1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_worker",
  traceId: "trace",
} as Parameters<typeof createWorkerReportedIssue>[1];

const validSession = {
  id: "s1",
  tenant_id: "t1",
  user_id: "u1",
  purpose: "issue_evidence",
  status: "finalized",
  object_path: "media/s1/e.jpg",
  mime_type: "image/jpeg",
  size_bytes: 123,
  created_at: "2026-09-06T00:00:00Z",
  expires_at: "2026-09-07T00:00:00Z",
};

const issue = {
  id: "i1",
  project_id: "p1",
  tenant_id: "t1",
  title: "Fence",
  description: null,
  status: "open",
  task_id: null,
  milestone_id: null,
  created_by: "u1",
  resolved_at: null,
  resolved_by: null,
  created_at: "",
  updated_at: "",
  evidence_upload_session_id: "s1",
};

describe("worker issue evidence binding", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const projectRepo = await import("@/lib/domain/projects/project.repository");
    const uploadSessions = await import("@/lib/domain/upload-session/upload-session.repository");
    const repo = await import("./issue.repository");
    vi.mocked(projectRepo.getById).mockResolvedValue({ id: "p1", tenant_id: "t1" } as never);
    vi.mocked(uploadSessions.getById).mockResolvedValue(validSession as never);
    vi.mocked(repo.create).mockResolvedValue(issue as never);
    vi.mocked(repo.getById).mockResolvedValue(issue as never);
    vi.mocked(repo.update).mockResolvedValue(issue as never);
    vi.mocked(repo.attachEvidenceUrls).mockImplementation(async (_client, issues) => issues);
  });

  it("accepts an own finalized issue_evidence session on create and trims the id", async () => {
    const repo = await import("./issue.repository");
    const result = await createWorkerReportedIssue(supabase, ctx, {
      project_id: "p1",
      title: "Fence",
      evidence_upload_session_id: "  s1  ",
    });

    expect(result.error).toBe("");
    expect(repo.create).toHaveBeenCalledWith(
      supabase,
      "t1",
      "u1",
      expect.objectContaining({ evidence_upload_session_id: "s1" })
    );
  });

  it.each([
    ["foreign owner", { ...validSession, user_id: "u2" }],
    ["wrong purpose", { ...validSession, purpose: "report_after" }],
    ["not finalized", { ...validSession, status: "uploaded" }],
  ])("rejects %s evidence on create", async (_label, session) => {
    const uploadSessions = await import("@/lib/domain/upload-session/upload-session.repository");
    const repo = await import("./issue.repository");
    vi.mocked(uploadSessions.getById).mockResolvedValueOnce(session as never);

    const result = await createWorkerReportedIssue(supabase, ctx, {
      project_id: "p1",
      title: "Fence",
      evidence_upload_session_id: "s1",
    });

    expect(result).toEqual({ data: null, error: "Invalid issue evidence" });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("accepts own finalized evidence on a worker-owned open issue update", async () => {
    const repo = await import("./issue.repository");
    const result = await updateWorkerReportedIssue(supabase, ctx, "i1", {
      evidence_upload_session_id: " s1 ",
      status: "in_review",
    });

    expect(result.error).toBe("");
    expect(repo.update).toHaveBeenCalledWith(
      supabase,
      "i1",
      "t1",
      expect.objectContaining({ evidence_upload_session_id: "s1", status: "in_review" })
    );
  });

  it("rejects a foreign evidence session on worker update", async () => {
    const uploadSessions = await import("@/lib/domain/upload-session/upload-session.repository");
    const repo = await import("./issue.repository");
    vi.mocked(uploadSessions.getById).mockResolvedValueOnce({ ...validSession, user_id: "u2" } as never);

    const result = await updateWorkerReportedIssue(supabase, ctx, "i1", {
      evidence_upload_session_id: "s1",
    });

    expect(result).toEqual({ data: null, error: "Invalid issue evidence" });
    expect(repo.update).not.toHaveBeenCalled();
  });
});
