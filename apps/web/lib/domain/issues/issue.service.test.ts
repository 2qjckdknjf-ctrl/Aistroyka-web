import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listIssues,
  createIssue,
  createWorkerReportedIssue,
  updateIssue,
  updateWorkerReportedIssue,
  getIssueById,
} from "./issue.service";

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canReadProjects: vi.fn(() => true),
  canManageProjects: vi.fn(() => true),
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(() => Promise.resolve({ id: "proj-1", name: "Test", tenant_id: "t1" })),
}));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(() => Promise.resolve()),
  notifyUser: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/domain/tasks/task.repository", () => ({
  getById: vi.fn(() => Promise.resolve(null)),
}));
vi.mock("./issue.repository", () => ({
  listByProject: vi.fn(() => Promise.resolve([])),
  getById: vi.fn(() => Promise.resolve(null)),
  create: vi.fn(() => Promise.resolve(null)),
  update: vi.fn(() => Promise.resolve(null)),
  attachEvidenceUrls: vi.fn(async (_supabase: unknown, issues: unknown[]) => issues),
}));

const noopSupabase = {} as SupabaseClient;
const ctx = { tenantId: "t1", userId: "u1" } as Parameters<typeof listIssues>[2];

describe("issue.service", () => {
  beforeEach(async () => {
    const projectRepo = await import("@/lib/domain/projects/project.repository");
    const repo = await import("./issue.repository");
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "proj-1",
      name: "Test",
      tenant_id: "t1",
    } as never);
    vi.mocked(repo.attachEvidenceUrls).mockImplementation(async (_supabase, issues) => issues);
  });

  it("listIssues returns data when project exists", async () => {
    const repo = await import("./issue.repository");
    vi.mocked(repo.listByProject).mockResolvedValue([
      {
        id: "i1",
        project_id: "proj-1",
        tenant_id: "t1",
        title: "Bug",
        description: null,
        status: "open",
        task_id: null,
        milestone_id: null,
        created_by: null,
        resolved_at: null,
        resolved_by: null,
        created_at: "",
        updated_at: "",
      },
    ]);

    const { data, error } = await listIssues(noopSupabase, ctx, "proj-1");
    expect(error).toBe("");
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Bug");
  });

  it("createIssue returns error when title empty", async () => {
    const { data, error } = await createIssue(noopSupabase, ctx, {
      project_id: "proj-1",
      title: "  ",
    });
    expect(data).toBeNull();
    expect(error).toBe("title required");
  });

  it("createWorkerReportedIssue allows a project reader", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    vi.mocked(policy.canManageProjects).mockReturnValue(false);
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    const repo = await import("./issue.repository");
    vi.mocked(repo.create).mockResolvedValue({
      id: "i2",
      project_id: "proj-1",
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
    });
    const { data, error } = await createWorkerReportedIssue(noopSupabase, ctx, {
      project_id: "proj-1",
      title: "Fence",
    });
    expect(error).toBe("");
    expect(data?.id).toBe("i2");
  });

  it("updateIssue notifies the reporter when a manager changes status", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const notifications = await import("@/lib/domain/notifications/manager-notifications.repository");
    vi.mocked(policy.canManageProjects).mockReturnValue(true);
    const repo = await import("./issue.repository");
    const updated = {
      id: "i3",
      project_id: "proj-1",
      tenant_id: "t1",
      title: "Fence",
      description: null,
      status: "resolved" as const,
      task_id: null,
      milestone_id: null,
      created_by: "worker-9",
      resolved_at: "",
      resolved_by: "u1",
      created_at: "",
      updated_at: "",
    };
    vi.mocked(repo.getById).mockResolvedValue(updated);
    vi.mocked(repo.update).mockResolvedValue(updated);
    const { data, error } = await updateIssue(noopSupabase, ctx, "i3", { status: "resolved" });
    expect(error).toBe("");
    expect(data?.id).toBe("i3");
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      noopSupabase,
      "t1",
      "worker-9",
      expect.objectContaining({ type: "issue_status_changed", target_id: "i3" })
    );
  });

  it("updateIssue notifies the assigned worker when the issue is on a task", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const notifications = await import("@/lib/domain/notifications/manager-notifications.repository");
    const tasks = await import("@/lib/domain/tasks/task.repository");
    vi.mocked(policy.canManageProjects).mockReturnValue(true);
    vi.mocked(notifications.notifyUser).mockClear();
    vi.mocked(tasks.getById).mockResolvedValue({
      id: "task-1",
      assigned_to: "assignee-2",
    } as never);
    const repo = await import("./issue.repository");
    const updated = {
      id: "i4",
      project_id: "proj-1",
      tenant_id: "t1",
      title: "Fence",
      description: null,
      status: "closed" as const,
      task_id: "task-1",
      milestone_id: null,
      created_by: "u1",
      resolved_at: "",
      resolved_by: "u1",
      created_at: "",
      updated_at: "",
    };
    vi.mocked(repo.getById).mockResolvedValue(updated);
    vi.mocked(repo.update).mockResolvedValue(updated);
    await updateIssue(noopSupabase, ctx, "i4", { status: "closed" });
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      noopSupabase,
      "t1",
      "assignee-2",
      expect.objectContaining({ type: "issue_status_changed", target_id: "i4" })
    );
  });

  it("getIssueById attaches evidence_url", async () => {
    const repo = await import("./issue.repository");
    vi.mocked(repo.getById).mockResolvedValue({
      id: "i5",
      project_id: "proj-1",
      tenant_id: "t1",
      title: "Fence",
      description: null,
      status: "open",
      task_id: null,
      milestone_id: null,
      created_by: "worker-9",
      resolved_at: null,
      resolved_by: null,
      created_at: "",
      updated_at: "",
    });
    vi.mocked(repo.attachEvidenceUrls).mockImplementation(async (_supabase, issues) =>
      issues.map((issue) => ({ ...issue, evidence_url: "https://cdn.example/e.jpg" }))
    );
    const { data, error } = await getIssueById(noopSupabase, ctx, "i5");
    expect(error).toBe("");
    expect(data?.id).toBe("i5");
    expect(data?.evidence_url).toBe("https://cdn.example/e.jpg");
  });

  it("updateWorkerReportedIssue rejects resolve", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    const { data, error } = await updateWorkerReportedIssue(noopSupabase, ctx, "i1", {
      status: "resolved",
    });
    expect(data).toBeNull();
    expect(error).toBe("Insufficient rights");
  });

  it("updateWorkerReportedIssue rejects another project reader", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const repo = await import("./issue.repository");
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "i6",
      project_id: "proj-1",
      tenant_id: "t1",
      title: "Fence",
      description: null,
      status: "open",
      task_id: null,
      milestone_id: null,
      created_by: "other-worker",
      resolved_at: null,
      resolved_by: null,
      created_at: "",
      updated_at: "",
    });
    vi.mocked(repo.update).mockClear();
    const { data, error } = await updateWorkerReportedIssue(noopSupabase, ctx, "i6", {
      description: "not mine",
    });
    expect(data).toBeNull();
    expect(error).toBe("Insufficient rights");
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("updateWorkerReportedIssue allows the reporter", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const repo = await import("./issue.repository");
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    const existing = {
      id: "i7",
      project_id: "proj-1",
      tenant_id: "t1",
      title: "Fence",
      description: null,
      status: "open" as const,
      task_id: null,
      milestone_id: null,
      created_by: "u1",
      resolved_at: null,
      resolved_by: null,
      created_at: "",
      updated_at: "",
    };
    vi.mocked(repo.getById).mockResolvedValue(existing);
    vi.mocked(repo.update).mockResolvedValue({ ...existing, status: "in_review" });
    const { data, error } = await updateWorkerReportedIssue(noopSupabase, ctx, "i7", {
      status: "in_review",
    });
    expect(error).toBe("");
    expect(data?.id).toBe("i7");
  });

  it("updateWorkerReportedIssue allows the assigned worker", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const tasks = await import("@/lib/domain/tasks/task.repository");
    const repo = await import("./issue.repository");
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    vi.mocked(tasks.getById).mockResolvedValue({
      id: "task-7",
      assigned_to: "u1",
    } as never);
    const existing = {
      id: "i8",
      project_id: "proj-1",
      tenant_id: "t1",
      title: "Fence",
      description: null,
      status: "open" as const,
      task_id: "task-7",
      milestone_id: null,
      created_by: "other-worker",
      resolved_at: null,
      resolved_by: null,
      created_at: "",
      updated_at: "",
    };
    vi.mocked(repo.getById).mockResolvedValue(existing);
    vi.mocked(repo.update).mockResolvedValue({ ...existing, description: "photo added" });
    const { data, error } = await updateWorkerReportedIssue(noopSupabase, ctx, "i8", {
      description: "photo added",
    });
    expect(error).toBe("");
    expect(data?.id).toBe("i8");
  });
});
