import { describe, expect, it, vi } from "vitest";
import { transitionHandover } from "./project-handover.service";
import * as repo from "./project-handover.repository";
import * as policy from "./project-handover.policy";
import * as readiness from "./handover-readiness";

vi.mock("./project-handover.repository", () => ({
  getByProject: vi.fn(),
  insertHandover: vi.fn(),
  updateHandover: vi.fn(),
  listEvents: vi.fn(),
  insertEvent: vi.fn(),
  listRecentEventsForTimeline: vi.fn(),
}));

vi.mock("./project-handover.policy", () => ({
  canManageProjectHandover: vi.fn(),
  canReadProjectHandover: vi.fn(),
}));

vi.mock("./handover-readiness", () => ({
  computeHandoverReadiness: vi.fn(),
}));

describe("project-handover.service", () => {
  const ctx = { tenantId: "t1", userId: "u1", role: "owner" } as never;
  const supabase = {} as never;

  it("transitionHandover rejects when not ready for handover_ready", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(true);
    vi.mocked(repo.getByProject).mockResolvedValue({
      id: "h1",
      project_id: "p1",
      tenant_id: "t1",
      status: "in_progress",
    } as never);
    vi.mocked(readiness.computeHandoverReadiness).mockResolvedValue({
      ready: false,
      blockers: [{ code: "x", severity: "blocking", title: "T", detail: "d", count: 1, href: null }],
    });
    const r = await transitionHandover(supabase, ctx, "p1", "handover_ready", null);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("blocked");
    expect(repo.updateHandover).not.toHaveBeenCalled();
  });

  it("transitionHandover advances when ready", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(true);
    vi.mocked(repo.getByProject).mockResolvedValue({
      id: "h1",
      project_id: "p1",
      tenant_id: "t1",
      status: "in_progress",
    } as never);
    vi.mocked(readiness.computeHandoverReadiness).mockResolvedValue({ ready: true, blockers: [] });
    vi.mocked(repo.updateHandover).mockResolvedValue(true);
    vi.mocked(repo.insertEvent).mockResolvedValue({} as never);
    const r = await transitionHandover(supabase, ctx, "p1", "handover_ready", null);
    expect(r.ok).toBe(true);
    expect(repo.updateHandover).toHaveBeenCalled();
    expect(repo.insertEvent).toHaveBeenCalled();
  });
});
