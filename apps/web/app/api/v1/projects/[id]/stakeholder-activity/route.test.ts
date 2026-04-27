import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as projectService from "@/lib/domain/projects/project.service";
import * as timelineRepo from "@/lib/domain/projects/stakeholder-activity-timeline.repository";
import * as policy from "@/lib/domain/stakeholders/stakeholders.policy";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/projects/project.service");
vi.mock("@/lib/domain/projects/stakeholder-activity-timeline.repository", () => ({
  getStakeholderActivityTimeline: vi.fn(),
  shapeManagerAudience: vi.fn((x: unknown[]) => x),
  shapeStakeholderAudience: vi.fn((x: unknown[]) => x),
}));
vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn(),
}));

describe("GET /api/v1/projects/:id/stakeholder-activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns manager audience when internal workspace", async () => {
    vi.mocked(projectService.getProjectForInternalWorkspace).mockResolvedValue({
      data: { id: "p1", name: "P", tenant_id: "t1" } as never,
      error: null,
    });
    vi.mocked(timelineRepo.getStakeholderActivityTimeline).mockResolvedValue([]);
    const req = new Request("https://test/api/v1/projects/p1/stakeholder-activity");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("manager");
    expect(timelineRepo.getStakeholderActivityTimeline).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ viewer: "manager" })
    );
    expect(timelineRepo.shapeManagerAudience).toHaveBeenCalled();
    expect(timelineRepo.shapeStakeholderAudience).not.toHaveBeenCalled();
  });

  it("returns stakeholder audience when portal-only", async () => {
    vi.mocked(projectService.getProjectForInternalWorkspace).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });
    vi.mocked(policy.canReadClientPortalView).mockResolvedValue(true);
    vi.mocked(timelineRepo.getStakeholderActivityTimeline).mockResolvedValue([]);
    const req = new Request("https://test/api/v1/projects/p1/stakeholder-activity");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("stakeholder");
    expect(timelineRepo.getStakeholderActivityTimeline).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ viewer: "stakeholder" })
    );
    expect(timelineRepo.shapeStakeholderAudience).toHaveBeenCalled();
    expect(timelineRepo.shapeManagerAudience).not.toHaveBeenCalled();
  });

  it("returns 403 when neither internal nor portal", async () => {
    vi.mocked(projectService.getProjectForInternalWorkspace).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });
    vi.mocked(policy.canReadClientPortalView).mockResolvedValue(false);
    const req = new Request("https://test/api/v1/projects/p1/stakeholder-activity");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });
});
