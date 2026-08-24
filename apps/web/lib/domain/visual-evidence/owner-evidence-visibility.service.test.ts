import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyOwnerVisibilityOnReportReview } from "./owner-evidence-visibility.service";

const emitAudit = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: vi.fn(async () => ({ id: "r1", task_id: "t1", tenant_id: "tenant-a" })),
  getProjectIdForReport: vi.fn(async () => "p1"),
}));

function makeSelectChain(data: unknown[]) {
  let eqCount = 0;
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn(() => {
    eqCount++;
    if (eqCount >= 3) {
      return Promise.resolve({ data, error: null });
    }
    return chain;
  });
  return chain;
}

function makeSupabase(evidenceRows: unknown[], updateResult: unknown[] = []) {
  const updateChain: Record<string, unknown> = {};
  updateChain.eq = vi.fn(() => updateChain);
  updateChain.in = vi.fn(() => updateChain);
  updateChain.select = vi.fn(async () => ({ data: updateResult, error: null }));

  const update = vi.fn(() => updateChain);

  return {
    from: vi.fn((table: string) => {
      if (table === "visual_evidence_records") {
        return {
          select: vi.fn(() => makeSelectChain(evidenceRows)),
          update,
        };
      }
      return {};
    }),
    _update: update,
  } as unknown as import("@supabase/supabase-js").SupabaseClient & { _update: ReturnType<typeof vi.fn> };
}

describe("applyOwnerVisibilityOnReportReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows eligible evidence on approved report", async () => {
    const sb = makeSupabase(
      [
        {
          id: "e1",
          owner_visible: false,
          manager_verified: false,
          internal_only: false,
          retention_state: "active",
          project_id: "p1",
        },
      ],
      [{ id: "e1" }]
    );

    const result = await applyOwnerVisibilityOnReportReview(sb, {
      tenantId: "tenant-a",
      reportId: "r1",
      projectId: "p1",
      reviewerId: "mgr1",
      reviewStatus: "approved",
    });

    expect(result.updated_count).toBe(1);
    expect(emitAudit).toHaveBeenCalled();
  });

  it("hides evidence on rejected report", async () => {
    const sb = makeSupabase(
      [
        {
          id: "e1",
          owner_visible: true,
          manager_verified: true,
          internal_only: false,
          retention_state: "active",
          project_id: "p1",
        },
      ],
      [{ id: "e1" }]
    );

    const result = await applyOwnerVisibilityOnReportReview(sb, {
      tenantId: "tenant-a",
      reportId: "r1",
      projectId: "p1",
      reviewerId: "mgr1",
      reviewStatus: "rejected",
    });

    expect(result.updated_count).toBe(1);
  });

  it("skips internal evidence on approval", async () => {
    const sb = makeSupabase([
      {
        id: "e1",
        owner_visible: false,
        manager_verified: false,
        internal_only: true,
        retention_state: "active",
        project_id: "p1",
      },
    ]);

    const result = await applyOwnerVisibilityOnReportReview(sb, {
      tenantId: "tenant-a",
      reportId: "r1",
      projectId: "p1",
      reviewerId: "mgr1",
      reviewStatus: "approved",
    });

    expect(result.updated_count).toBe(0);
    expect(result.idempotent).toBe(true);
  });

  it("is idempotent on repeated approval", async () => {
    const sb = makeSupabase([
      {
        id: "e1",
        owner_visible: true,
        manager_verified: true,
        internal_only: false,
        retention_state: "active",
        project_id: "p1",
      },
    ]);

    const result = await applyOwnerVisibilityOnReportReview(sb, {
      tenantId: "tenant-a",
      reportId: "r1",
      projectId: "p1",
      reviewerId: "mgr1",
      reviewStatus: "approved",
    });

    expect(result.updated_count).toBe(0);
    expect(result.idempotent).toBe(true);
    expect(emitAudit).not.toHaveBeenCalled();
  });
});
