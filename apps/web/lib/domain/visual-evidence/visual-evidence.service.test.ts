import { describe, expect, it, vi } from "vitest";
import { syncEvidenceFromReportMedia } from "./visual-evidence.service";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("syncEvidenceFromReportMedia", () => {
  it("uses the report UUID as the shared before/after pair group", async () => {
    const inserts: Array<Record<string, unknown>> = [];
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "worker_report_media") {
          return {
            select: () => ({
              eq: async () => ({
                data: [
                  { media_id: "media-before", upload_session_id: "session-before" },
                  { media_id: "media-after", upload_session_id: "session-after" },
                ],
              }),
            }),
          };
        }
        if (table === "upload_sessions") {
          return {
            select: () => ({
              in: async () => ({
                data: [
                  { id: "session-before", purpose: "report_before" },
                  { id: "session-after", purpose: "report_after" },
                ],
              }),
            }),
          };
        }
        if (table === "visual_evidence_records") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
            insert: (row: Record<string, unknown>) => {
              inserts.push(row);
              return {
                select: () => ({
                  single: async () => ({ data: { id: "evidence-1", ...row }, error: null }),
                }),
              };
            },
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const reportId = "11111111-1111-1111-1111-111111111111";
    const synced = await syncEvidenceFromReportMedia(
      supabase,
      "tenant-1",
      reportId,
      "project-1",
      "task-1",
      "user-1"
    );

    expect(synced).toBe(2);
    expect(inserts).toHaveLength(2);
    expect(inserts[0]?.pair_group_id).toBe(reportId);
    expect(inserts[1]?.pair_group_id).toBe(reportId);
    expect(inserts[0]?.before_after_kind).toBe("before");
    expect(inserts[1]?.before_after_kind).toBe("after");
  });
});
