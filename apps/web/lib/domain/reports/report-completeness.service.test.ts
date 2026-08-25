import { describe, expect, it, vi, beforeEach } from "vitest";
import { evaluateReportCompleteness } from "./report-completeness.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));

vi.mock("./report.repository", () => ({
  getById: vi.fn(async () => ({
    id: "r1",
    tenant_id: "t1",
    user_id: "u1",
    task_id: "task1",
    status: "draft",
    worker_note: "",
  })),
  getProjectIdForReport: vi.fn(async () => "p1"),
  listMediaByReportId: vi.fn(async () => []),
}));

function mockSupabase() {
  return {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        in: async () => ({ data: [], error: null }),
      }),
    })),
  } as unknown as SupabaseClient;
}

describe("evaluateReportCompleteness admin persistence", () => {
  beforeEach(() => {
    vi.mocked(getAdminClient).mockReset();
  });

  it("persists evaluation via service role admin client", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn(() => ({ upsert })),
    } as unknown as ReturnType<typeof getAdminClient>);

    await evaluateReportCompleteness(mockSupabase(), "t1", "r1");

    expect(getAdminClient).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "t1",
        report_id: "r1",
      }),
      { onConflict: "tenant_id,report_id" }
    );
  });

  it("returns evaluation even when admin client unavailable", async () => {
    vi.mocked(getAdminClient).mockReturnValue(null);
    const result = await evaluateReportCompleteness(mockSupabase(), "t1", "r1");
    expect(result.report_id).toBe("r1");
    expect(result.status).toBe("incomplete");
  });
});
