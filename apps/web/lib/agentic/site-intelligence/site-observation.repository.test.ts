import { describe, expect, it } from "vitest";
import { listPersistedImageSiteObservations } from "./site-observation.repository";

function chain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "order", "limit"]) api[method] = () => api;
  api.then = (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled);
  return api;
}

const analysis = {
  id: "analysis-1", media_id: "media-1", job_id: "job-1", stage: "finishing",
  completion_percent: 80, risk_level: "high", detected_issues: ["Open edge"],
  recommendations: ["Install protection"], created_at: "2026-09-09T01:00:00+00:00",
};

describe("persisted site observation repository", () => {
  it("binds durable analysis to project-scoped media provenance", async () => {
    const supabase = { from(table: string) {
      if (table === "media") return chain({ data: [{ id: "media-1", uploaded_at: "2026-09-09T03:00:00+02:00" }], error: null });
      if (table === "ai_analysis") return chain({ data: [analysis], error: null });
      throw new Error(`unexpected:${table}`);
    }};
    const rows = await listPersistedImageSiteObservations(supabase as never, { tenantId: "t1", projectId: "p1" });
    expect(rows[0]?.analysisCreatedAt).toBe("2026-09-09T01:00:00.000Z");
    expect(rows[0]?.observation.insufficientEvidence).toBe(false);
    expect(rows[0]?.observation.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "PHOTO", capturedAt: "2026-09-09T01:00:00.000Z" }),
      expect.objectContaining({ type: "DATABASE_STATE", sourceEntityId: "analysis-1" }),
    ]));
  });

  it("never substitutes analysis time for missing media capture provenance", async () => {
    const supabase = { from(table: string) {
      if (table === "media") return chain({ data: [{ id: "media-1", uploaded_at: null }], error: null });
      return chain({ data: [analysis], error: null });
    }};
    const rows = await listPersistedImageSiteObservations(supabase as never, { tenantId: "t1", projectId: "p1" });
    expect(rows[0]?.observation.insufficientEvidence).toBe(true);
    expect(rows[0]?.observation.limitations).toContain("MISSING_CAPTURE_TIME");
    expect(rows[0]?.observation.evidence.some((e) => e.type === "PHOTO")).toBe(false);
  });

  it("fails closed on malformed persisted analysis time", async () => {
    const supabase = { from(table: string) {
      if (table === "media") return chain({ data: [{ id: "media-1", uploaded_at: "2026-09-09T00:00:00Z" }], error: null });
      return chain({ data: [{ ...analysis, created_at: "bad" }], error: null });
    }};
    await expect(listPersistedImageSiteObservations(supabase as never, { tenantId: "t1", projectId: "p1" }))
      .rejects.toMatchObject({ code: "AGENT_SKILL_FAILED", message: "invalid_persisted_timestamp:get_site_observations:analysis" });
  });
});
