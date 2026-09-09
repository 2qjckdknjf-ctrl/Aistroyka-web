import { describe, expect, it } from "vitest";
import { AgentError } from "../errors";
import { listPersistedImageSiteObservations } from "./site-observation.repository";

function chain(result: { data: unknown; error: unknown }, calls: Array<{ method: string; args: unknown[] }>) {
  const api: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "order", "limit"]) {
    api[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return api;
    };
  }
  api.then = (onFulfilled: (value: unknown) => unknown, onRejected?: (error: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

function analysisRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "analysis-1",
    media_id: "media-1",
    job_id: "job-1",
    stage: "finishing",
    completion_percent: 80,
    risk_level: "high",
    detected_issues: ["Open edge"],
    recommendations: ["Install protection"],
    created_at: "2026-09-09T01:00:00.000Z",
    ...overrides,
  };
}

describe("listPersistedImageSiteObservations", () => {
  it("reads project-scoped media first and returns the latest durable analysis per media", async () => {
    const mediaCalls: Array<{ method: string; args: unknown[] }> = [];
    const analysisCalls: Array<{ method: string; args: unknown[] }> = [];
    const supabase = {
      from(table: string) {
        if (table === "media") {
          return chain(
            {
              data: [
                { id: "media-1", uploaded_at: "2026-09-09T00:00:00.000Z" },
                { id: "media-2", uploaded_at: "2026-09-08T00:00:00+00:00" },
              ],
              error: null,
            },
            mediaCalls
          );
        }
        if (table === "ai_analysis") {
          return chain(
            {
              data: [
                analysisRow({ id: "analysis-new", job_id: "job-new" }),
                analysisRow({
                  id: "analysis-old",
                  job_id: "job-old",
                  stage: "rough-in",
                  completion_percent: 50,
                  risk_level: "low",
                  detected_issues: [],
                  recommendations: [],
                  created_at: "2026-09-08T01:00:00.000Z",
                }),
                analysisRow({
                  id: "analysis-2",
                  media_id: "media-2",
                  job_id: null,
                  stage: null,
                  completion_percent: null,
                  risk_level: "unexpected",
                  detected_issues: null,
                  recommendations: null,
                  created_at: "2026-09-08T02:00:00+00:00",
                }),
              ],
              error: null,
            },
            analysisCalls
          );
        }
        throw new Error(`unexpected table:${table}`);
      },
    };

    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
      limit: 10,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.analysisId).toBe("analysis-new");
    expect(rows[0]?.observation.riskLevel).toBe("high");
    expect(rows[0]?.observation.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "PHOTO", sourceEntityId: "media-1" }),
        expect.objectContaining({ type: "DATABASE_STATE", sourceEntityId: "analysis-new" }),
      ])
    );
    expect(rows[1]?.analysisCreatedAt).toBe("2026-09-08T02:00:00.000Z");
    expect(rows[1]?.observation.riskLevel).toBe("medium");
    expect(rows[1]?.observation.stage).toBeNull();
    expect(rows[1]?.observation.insufficientEvidence).toBe(false);

    expect(mediaCalls).toEqual(
      expect.arrayContaining([
        { method: "eq", args: ["tenant_id", "tenant-1"] },
        { method: "eq", args: ["project_id", "project-1"] },
      ])
    );
    expect(analysisCalls.some((call) => call.method === "in" && call.args[0] === "media_id")).toBe(true);
  });

  it("does not substitute analysis creation time for missing media capture provenance", async () => {
    const supabase = {
      from(table: string) {
        if (table === "media") {
          return chain({ data: [{ id: "media-1", uploaded_at: null }], error: null }, []);
        }
        if (table === "ai_analysis") {
          return chain({ data: [analysisRow()], error: null }, []);
        }
        throw new Error(`unexpected table:${table}`);
      },
    };

    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.observation.insufficientEvidence).toBe(true);
    expect(rows[0]?.observation.limitations).toContain("MISSING_CAPTURE_TIME");
    expect(rows[0]?.observation.evidence).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "PHOTO" })])
    );
    expect(rows[0]?.observation.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "DATABASE_STATE",
          sourceEntityId: "analysis-1",
          capturedAt: "2026-09-09T01:00:00.000Z",
        }),
      ])
    );
  });

  it("fails closed instead of inventing wall-clock provenance for malformed analysis timestamp", async () => {
    const supabase = {
      from(table: string) {
        if (table === "media") {
          return chain(
            { data: [{ id: "media-1", uploaded_at: "2026-09-09T00:00:00.000Z" }], error: null },
            []
          );
        }
        if (table === "ai_analysis") {
          return chain({ data: [analysisRow({ created_at: "not-a-timestamp" })], error: null }, []);
        }
        throw new Error(`unexpected table:${table}`);
      },
    };

    await expect(
      listPersistedImageSiteObservations(supabase as never, {
        tenantId: "tenant-1",
        projectId: "project-1",
      })
    ).rejects.toMatchObject({
      code: "AGENT_SKILL_FAILED",
      message: "invalid_persisted_timestamp:get_site_observations:analysis",
    });
  });

  it("returns no observations without project media and never queries ai_analysis", async () => {
    let analysisQueried = false;
    const supabase = {
      from(table: string) {
        if (table === "media") return chain({ data: [], error: null }, []);
        if (table === "ai_analysis") analysisQueried = true;
        return chain({ data: [], error: null }, []);
      },
    };

    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
    });

    expect(rows).toEqual([]);
    expect(analysisQueried).toBe(false);
  });

  it("fails closed when the scoped media query fails", async () => {
    const supabase = {
      from() {
        return chain({ data: null, error: { message: "rls denied" } }, []);
      },
    };

    await expect(
      listPersistedImageSiteObservations(supabase as never, {
        tenantId: "tenant-1",
        projectId: "project-1",
      })
    ).rejects.toMatchObject({
      code: "AGENT_SKILL_FAILED",
      message: "query_failed:get_site_observations:media",
    });

    await expect(
      listPersistedImageSiteObservations(supabase as never, {
        tenantId: "tenant-1",
        projectId: "project-1",
      })
    ).rejects.toBeInstanceOf(AgentError);
  });
});
