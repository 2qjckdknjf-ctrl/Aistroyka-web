import { describe, expect, it, vi } from "vitest";
import { evaluateReportCompleteness, COMPLETENESS_RULES_VERSION } from "./report-completeness.service";
import type { SupabaseClient } from "@supabase/supabase-js";

function mockSupabase(report: Record<string, unknown> | null, mediaRows: unknown[] = []) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn((table: string) => {
      if (table === "worker_reports") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: report, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "worker_tasks") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { required_photos: { before: 1, after: 1 }, title: "Zone A" },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "upload_sessions") {
        return {
          select: () => ({
            in: async () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "report_completeness_evaluations") {
        return { upsert };
      }
      return {};
    }),
    _upsert: upsert,
  } as unknown as SupabaseClient & { _upsert: ReturnType<typeof vi.fn> };
}

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

describe("evaluateReportCompleteness", () => {
  it("returns incomplete when media and worker note missing", async () => {
    const sb = mockSupabase(null);
    const result = await evaluateReportCompleteness(sb, "t1", "r1");
    expect(result.status).toBe("incomplete");
    expect(result.missing_fields).toContain("media");
    expect(result.missing_fields).toContain("worker_note");
    expect(result.rules_version).toBe(COMPLETENESS_RULES_VERSION);
  });
});
