import { beforeEach, describe, expect, it, vi } from "vitest";
import { addMediaToReport } from "./report.service";
import * as repo from "./report.repository";

vi.mock("./report.policy", () => ({
  canCreateReport: vi.fn().mockReturnValue(true),
}));

vi.mock("./report.repository", () => ({
  getById: vi.fn(),
  addMedia: vi.fn(),
}));

vi.mock("@/lib/domain/tasks/task.repository", () => ({ getById: vi.fn() }));
vi.mock("@/lib/domain/task-assignments", () => ({ isTaskAssignedTo: vi.fn() }));
vi.mock("@/lib/platform/jobs/job.service", () => ({ enqueueJob: vi.fn() }));
vi.mock("@/lib/observability/audit.service", () => ({ emitAudit: vi.fn() }));
vi.mock("@/lib/sync/change-log.repository", () => ({ emitChange: vi.fn() }));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(),
  notifyTenantManagers: vi.fn(),
}));

const ctx = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member" as const,
  subscriptionTier: "free",
  clientProfile: "ios_worker" as const,
  traceId: "trace-1",
};

describe("addMediaToReport resubmit window", () => {
  beforeEach(() => {
    vi.mocked(repo.getById).mockReset();
    vi.mocked(repo.addMedia).mockReset();
  });

  it("attaches correction evidence while changes are requested", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "worker-1",
      status: "changes_requested",
    } as never);
    vi.mocked(repo.addMedia).mockResolvedValue(true);

    const result = await addMediaToReport({} as never, ctx, "report-1", {
      uploadSessionId: "session-1",
    });

    expect(result).toEqual({ ok: true, error: "" });
    expect(repo.addMedia).toHaveBeenCalledWith({}, "report-1", {
      uploadSessionId: "session-1",
    });
  });

  it("still rejects media once the report is submitted", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "worker-1",
      status: "submitted",
    } as never);

    const result = await addMediaToReport({} as never, ctx, "report-1", {
      uploadSessionId: "session-1",
    });

    expect(result).toEqual({ ok: false, error: "Report already submitted" });
    expect(repo.addMedia).not.toHaveBeenCalled();
  });
});
