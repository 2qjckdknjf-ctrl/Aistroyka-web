import { describe, expect, it, vi, beforeEach } from "vitest";
import { computeHandoverReadiness } from "./handover-readiness";
import * as summaryRepo from "@/lib/domain/projects/project-summary.repository";
import * as defectRepo from "@/lib/domain/defects/defects.repository";

vi.mock("@/lib/domain/projects/project-summary.repository", () => ({
  getProjectSummary: vi.fn(),
}));

vi.mock("@/lib/domain/defects/defects.repository", () => ({
  countBlockingOpen: vi.fn(),
}));

function buildSupabaseMock() {
  const chainIn = {
    select: () => ({
      eq: () => ({
        eq: () => ({
          in: () => Promise.resolve({ count: 0, error: null }),
        }),
      }),
    }),
  };
  const chain4eq = {
    select: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      }),
    }),
  };
  return {
    from: (name: string) => (name === "project_client_requests" ? chain4eq : chainIn),
  };
}

describe("computeHandoverReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(summaryRepo.getProjectSummary).mockResolvedValue({
      overdueMilestonesCount: 0,
      openIssuesCount: 0,
      pendingReportApprovalsCount: 0,
    } as never);
  });

  it("adds blocking_punch_defects when open blocking defects exist", async () => {
    vi.mocked(defectRepo.countBlockingOpen).mockResolvedValue(2);
    const supabase = buildSupabaseMock() as never;
    const r = await computeHandoverReadiness(supabase, "p1", "t1");
    const b = r.blockers.find((x) => x.code === "blocking_punch_defects");
    expect(b).toBeDefined();
    expect(b?.count).toBe(2);
    expect(b?.href).toContain("tab=defects");
    expect(r.ready).toBe(false);
  });

  it("is ready when no blockers including defects", async () => {
    vi.mocked(defectRepo.countBlockingOpen).mockResolvedValue(0);
    const supabase = buildSupabaseMock() as never;
    const r = await computeHandoverReadiness(supabase, "p1", "t1");
    expect(r.ready).toBe(true);
    expect(r.blockers).toHaveLength(0);
  });
});
