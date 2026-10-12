import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitReport } from "./report.service";
import * as repo from "./report.repository";
import { emitAudit } from "@/lib/observability/audit.service";

vi.mock("./report.repository");
vi.mock("@/lib/domain/tasks/task.repository");
vi.mock("@/lib/domain/task-assignments");
vi.mock("@/lib/sync/change-log.repository", () => ({ emitChange: vi.fn().mockResolvedValue(1) }));
vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectReportReviewers: vi.fn().mockResolvedValue(undefined),
  notifyTenantReportReviewers: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/platform/jobs/job.service", () => ({
  enqueueJob: vi.fn().mockResolvedValue(null),
}));
vi.mock("./report.policy", () => ({
  canCreateReport: vi.fn().mockReturnValue(true),
}));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn(() => null) }));

import { canCreateReport } from "./report.policy";
import { getAdminClient } from "@/lib/supabase/admin";
import { notifyProjectReportReviewers, notifyTenantReportReviewers } from "@/lib/domain/notifications/manager-notifications.repository";

const tenantId = "tenant-1";
const userId = "user-1";
const ctx = {
  tenantId,
  userId,
  role: "member",
  clientProfile: "ios_worker",
  subscriptionTier: "pro",
  traceId: "trace-1",
} as const;

describe("submitReport report_submit audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminClient).mockReturnValue(null);
    vi.mocked(canCreateReport).mockReturnValue(true);
    vi.mocked(emitAudit).mockResolvedValue(undefined);
    vi.mocked(repo.getProjectIdForReport).mockResolvedValue(null);
    vi.mocked(repo.listMediaByReportId).mockResolvedValue([{ media_id: "m1", upload_session_id: null }]);
  });

  it("emits one categorical event after a successful draft submit", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "rpt-1",
      tenant_id: tenantId,
      user_id: userId,
      day_id: "day-1",
      status: "draft",
      created_at: "2025-01-01T00:00:00Z",
      submitted_at: null,
      task_id: "task-1",
    } as never);
    vi.mocked(repo.submit).mockResolvedValue(true);
    const result = await submitReport({} as never, ctx as never, "rpt-1", "trace-1", {
      workerNote: "north wall poured",
    });
    expect(result.ok).toBe(true);
    expect(emitAudit).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(emitAudit).mock.calls[0]?.[1] as {
      tenant_id: string;
      user_id: string;
      action: string;
      resource_type: string;
      resource_id: string;
      details: Record<string, unknown>;
    };
    expect(payload).toMatchObject({
      tenant_id: tenantId,
      user_id: userId,
      action: "report_submit",
      resource_type: "report",
      resource_id: "rpt-1",
    });
    expect(payload.details).toEqual({
      source: "report_submit",
      client: "ios_worker",
      role: "member",
      has_task: true,
      has_day: true,
      has_media: true,
    });
    expect(JSON.stringify(payload.details)).not.toContain("north wall");
  });

  it("emits again on a legitimate resubmit after changes_requested", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "rpt-1",
      tenant_id: tenantId,
      user_id: userId,
      day_id: null,
      status: "changes_requested",
      created_at: "2025-01-01T00:00:00Z",
      submitted_at: null,
      task_id: "task-1",
    } as never);
    vi.mocked(repo.resubmit).mockResolvedValue(true);
    const result = await submitReport({} as never, ctx as never, "rpt-1", null, {});
    expect(result.ok).toBe(true);
    expect(emitAudit).toHaveBeenCalledTimes(1);
    expect(repo.submit).not.toHaveBeenCalled();
  });

  it("writes nothing when the report is already submitted", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "rpt-1",
      tenant_id: tenantId,
      user_id: userId,
      day_id: null,
      status: "submitted",
      created_at: "2025-01-01T00:00:00Z",
      submitted_at: "2025-01-01T01:00:00Z",
      task_id: "task-1",
    } as never);
    const result = await submitReport({} as never, ctx as never, "rpt-1", null, {});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Report already submitted");
    expect(repo.submit).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("writes nothing when the caller cannot submit", async () => {
    vi.mocked(canCreateReport).mockReturnValue(false);
    const result = await submitReport({} as never, ctx as never, "rpt-1", null, {});
    expect(result.ok).toBe(false);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("writes nothing when the transition update matches no row", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "rpt-1",
      tenant_id: tenantId,
      user_id: userId,
      day_id: null,
      status: "draft",
      created_at: "2025-01-01T00:00:00Z",
      submitted_at: null,
      task_id: "task-1",
    } as never);
    vi.mocked(repo.submit).mockResolvedValue(false);
    const result = await submitReport({} as never, ctx as never, "rpt-1", null, {});
    expect(result.ok).toBe(false);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("still succeeds when audit insertion throws", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "rpt-1",
      tenant_id: tenantId,
      user_id: userId,
      day_id: null,
      status: "draft",
      created_at: "2025-01-01T00:00:00Z",
      submitted_at: null,
      task_id: "task-1",
    } as never);
    vi.mocked(repo.submit).mockResolvedValue(true);
    vi.mocked(emitAudit).mockRejectedValue(new Error("audit down"));
    const result = await submitReport({} as never, ctx as never, "rpt-1", null, {});
    expect(result.ok).toBe(true);
  });
});

describe("submitted report reviewer authorization", () => {
  const draft = { id:"rpt-1",tenant_id:tenantId,user_id:userId,status:"draft",task_id:"task-1",day_id:null };
  beforeEach(() => {
    vi.clearAllMocks();vi.mocked(canCreateReport).mockReturnValue(true);
    vi.mocked(repo.submit).mockResolvedValue(true);
    vi.mocked(repo.listMediaByReportId).mockResolvedValue([{media_id:"m1",upload_session_id:null}]);
  });
  it("looks up assigned managers through the server after validating an author's submitted report",async () => {
    const caller={},admin={};vi.mocked(getAdminClient).mockReturnValue(admin as never);
    vi.mocked(repo.getById).mockResolvedValueOnce(draft as never).mockResolvedValueOnce({...draft,status:"submitted"} as never);
    vi.mocked(repo.getProjectIdForReport).mockImplementation(async client => client===admin?"project-1":null);
    expect((await submitReport(caller as never,ctx as never,"rpt-1")).ok).toBe(true);
    expect(notifyProjectReportReviewers).toHaveBeenCalledWith(admin,tenantId,"project-1",expect.objectContaining({target_id:"rpt-1"}));
    expect(notifyTenantReportReviewers).not.toHaveBeenCalled();
  });
  it.each([{tenant_id:"other-tenant"},{user_id:"other-author"},{status:"draft"}])("does not use server privileges when fresh binding changes %j",async changed => {
    vi.mocked(getAdminClient).mockReturnValue({} as never);
    vi.mocked(repo.getById).mockResolvedValueOnce(draft as never).mockResolvedValueOnce({...draft,status:"submitted",...changed} as never);
    vi.mocked(repo.getProjectIdForReport).mockResolvedValue(null);
    await submitReport({} as never,ctx as never,"rpt-1");
    expect(notifyProjectReportReviewers).not.toHaveBeenCalled();expect(notifyTenantReportReviewers).not.toHaveBeenCalled();
  });
});
