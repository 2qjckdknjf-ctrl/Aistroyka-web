import { describe, it, expect, vi, beforeEach } from "vitest";
import { transitionServiceRequest, patchServiceRequestManager } from "./aftercare.service";
import * as repo from "./aftercare.repository";
import * as policy from "./aftercare.policy";

vi.mock("./aftercare.repository", () => ({
  getById: vi.fn(),
  updateServiceRequest: vi.fn(),
  insertEvent: vi.fn(),
}));

vi.mock("@/lib/domain/project-handover/project-handover.repository", () => ({
  getByProject: vi.fn(),
}));

vi.mock("./aftercare.policy", () => ({
  canManageAftercareRequests: vi.fn(),
  canReadAftercareRequests: vi.fn(),
  canReportAftercareAsStakeholder: vi.fn(),
}));

const ctx = {
  tenantId: "t1",
  userId: "u1",
  role: "owner" as const,
  subscriptionTier: "free" as const,
  clientProfile: "web" as const,
  traceId: "x",
};

const supabase = {} as import("@supabase/supabase-js").SupabaseClient;

describe("transitionServiceRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(policy.canManageAftercareRequests).mockResolvedValue(true);
    vi.mocked(repo.updateServiceRequest).mockResolvedValue(true);
    vi.mocked(repo.insertEvent).mockResolvedValue(true);
  });

  it("requires resolution note when moving to resolved", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "r1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Leak",
      description: null,
      status: "in_progress",
      coverage_type: "warranty_review_needed",
      assigned_to: null,
      due_date: null,
      resolution_note: null,
      resolved_at: null,
      resolved_by: null,
      linked_handover_id: "h1",
      linked_defect_id: null,
      linked_discussion_id: null,
      created_by: "u2",
      created_at: "",
      updated_at: "",
    });
    const r = await transitionServiceRequest(supabase, ctx, "p1", "r1", "resolved", null, null);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Resolution");
  });

  it("requires closure note when closing before resolved", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "r1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Leak",
      description: null,
      status: "triaged",
      coverage_type: "not_warranty",
      assigned_to: null,
      due_date: null,
      resolution_note: null,
      resolved_at: null,
      resolved_by: null,
      linked_handover_id: "h1",
      linked_defect_id: null,
      linked_discussion_id: null,
      created_by: "u2",
      created_at: "",
      updated_at: "",
    });
    const r = await transitionServiceRequest(supabase, ctx, "p1", "r1", "closed", null, null);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Closure");
  });

  it("allows close from resolved without closure note", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "r1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Leak",
      description: null,
      status: "resolved",
      coverage_type: "warranty_covered",
      assigned_to: null,
      due_date: null,
      resolution_note: "Fixed",
      resolved_at: "2026-01-01T00:00:00Z",
      resolved_by: "u1",
      linked_handover_id: "h1",
      linked_defect_id: null,
      linked_discussion_id: null,
      created_by: "u2",
      created_at: "",
      updated_at: "",
    });
    const r = await transitionServiceRequest(supabase, ctx, "p1", "r1", "closed", null, null);
    expect(r.ok).toBe(true);
  });
});

describe("patchServiceRequestManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(policy.canManageAftercareRequests).mockResolvedValue(true);
    vi.mocked(repo.updateServiceRequest).mockResolvedValue(true);
  });

  it("rejects invalid coverage_type", async () => {
    vi.mocked(repo.getById).mockResolvedValue({
      id: "r1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Leak",
      description: null,
      status: "reported",
      coverage_type: "warranty_review_needed",
      assigned_to: null,
      due_date: null,
      resolution_note: null,
      resolved_at: null,
      resolved_by: null,
      linked_handover_id: "h1",
      linked_defect_id: null,
      linked_discussion_id: null,
      created_by: "u2",
      created_at: "",
      updated_at: "",
    });
    const r = await patchServiceRequestManager(supabase, ctx, "p1", "r1", {
      coverage_type: "invalid_coverage" as never,
    });
    expect(r.ok).toBe(false);
  });
});
