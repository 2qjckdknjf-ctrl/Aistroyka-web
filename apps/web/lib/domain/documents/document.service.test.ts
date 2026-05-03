import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDocument, updateDocument } from "./document.service";
import type { TenantContext } from "@/lib/tenant/tenant.types";

const mockProjectGetById = vi.fn();
const mockReportGetById = vi.fn();
const mockReportGetProjectId = vi.fn();
const mockTaskGetById = vi.fn();
const mockMilestoneGetById = vi.fn();
const mockRepoGetById = vi.fn();
const mockRepoCreate = vi.fn();
const mockRepoUpdate = vi.fn();
const mockInsertDocumentEvent = vi.fn();

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: (...args: unknown[]) => mockProjectGetById(...args),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: (...args: unknown[]) => mockReportGetById(...args),
  getProjectIdForReport: (...args: unknown[]) => mockReportGetProjectId(...args),
}));

vi.mock("@/lib/domain/tasks/task.repository", () => ({
  getById: (...args: unknown[]) => mockTaskGetById(...args),
}));

vi.mock("@/lib/domain/milestones/milestone.repository", () => ({
  getById: (...args: unknown[]) => mockMilestoneGetById(...args),
}));

vi.mock("./document.repository", () => ({
  getById: (...args: unknown[]) => mockRepoGetById(...args),
  create: (...args: unknown[]) => mockRepoCreate(...args),
  update: (...args: unknown[]) => mockRepoUpdate(...args),
}));

vi.mock("./document-event.repository", () => ({
  insertDocumentEvent: (...args: unknown[]) => mockInsertDocumentEvent(...args),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectOwners: vi.fn().mockResolvedValue(undefined),
}));

const ctx: TenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "member",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

describe("document.service linkage validation", () => {
  const supabase = {} as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectGetById.mockResolvedValue({ id: "project-1", tenant_id: "tenant-1" });
    mockReportGetById.mockResolvedValue(null);
    mockReportGetProjectId.mockResolvedValue(null);
    mockTaskGetById.mockResolvedValue(null);
    mockMilestoneGetById.mockResolvedValue(null);
    mockRepoGetById.mockResolvedValue({
      id: "doc-1",
      tenant_id: "tenant-1",
      project_id: "project-1",
      type: "document",
      title: "Doc",
      status: "draft",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
  });

  it("rejects create when task linkage is from another project", async () => {
    mockTaskGetById.mockResolvedValue({
      id: "task-1",
      project_id: "project-2",
      tenant_id: "tenant-1",
    });

    const result = await createDocument(supabase, ctx, {
      project_id: "project-1",
      type: "document",
      title: "Safety package",
      task_id: "task-1",
    });

    expect(result.error).toBe("invalid_task_linkage");
    expect(mockRepoCreate).not.toHaveBeenCalled();
  });

  it("rejects update when report linkage is from another project", async () => {
    mockReportGetById.mockResolvedValue({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "worker-1",
      status: "submitted",
    });
    mockReportGetProjectId.mockResolvedValue("project-2");

    const result = await updateDocument(supabase, ctx, "doc-1", "project-1", {
      report_id: "report-1",
    });

    expect(result.error).toBe("invalid_report_linkage");
    expect(mockRepoUpdate).not.toHaveBeenCalled();
  });

  it("allows create when milestone linkage belongs to the same project", async () => {
    mockMilestoneGetById.mockResolvedValue({
      id: "milestone-1",
      project_id: "project-1",
      tenant_id: "tenant-1",
    });
    mockRepoCreate.mockResolvedValue({
      id: "doc-new",
      tenant_id: "tenant-1",
      project_id: "project-1",
      type: "contract",
      title: "Contract package",
      status: "draft",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    const result = await createDocument(supabase, ctx, {
      project_id: "project-1",
      type: "contract",
      title: "Contract package",
      milestone_id: "milestone-1",
    });

    expect(result.error).toBe("");
    expect(result.data?.id).toBe("doc-new");
    expect(mockInsertDocumentEvent).toHaveBeenCalled();
  });
});
