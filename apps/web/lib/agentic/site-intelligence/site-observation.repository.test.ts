import { describe, expect, it } from "vitest";
import { AgentError } from "../errors";
import { listPersistedImageSiteObservations } from "./site-observation.repository";

interface MediaFixture { id: string; uploaded_at: string | null }
interface AnalysisFixture {
  id: string;
  media_id: string;
  job_id: string | null;
  stage: string | null;
  completion_percent: number | null;
  risk_level: string | null;
  detected_issues: string[] | null;
  recommendations: string[] | null;
  created_at: string;
}

function makeSupabase(input: {
  media?: MediaFixture[];
  analyses?: AnalysisFixture[];
  mediaError?: unknown;
  analysisError?: unknown;
}) {
  const analysisMediaQueries: string[] = [];

  function mediaQuery() {
    const api: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order", "limit"]) api[method] = () => api;
    api.then = (onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: input.media ?? [], error: input.mediaError ?? null }).then(onFulfilled);
    return api;
  }

  function analysisQuery() {
    let mediaId: string | null = null;
    let limit = Number.POSITIVE_INFINITY;
    const api: Record<string, unknown> = {};
    api.select = () => api;
    api.eq = (column: string, value: string) => {
      if (column === "media_id") {
        mediaId = value;
        analysisMediaQueries.push(value);
      }
      return api;
    };
    api.order = () => api;
    api.limit = (value: number) => {
      limit = value;
      return api;
    };
    api.then = (onFulfilled: (value: unknown) => unknown) => {
      const rows = (input.analyses ?? [])
        .filter((row) => row.media_id === mediaId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
      return Promise.resolve({ data: rows, error: input.analysisError ?? null }).then(onFulfilled);
    };
    return api;
  }

  return {
    supabase: {
      from(table: string) {
        if (table === "media") return mediaQuery();
        if (table === "ai_analysis") return analysisQuery();
        throw new Error(`unexpected table:${table}`);
      },
    },
    analysisMediaQueries,
  };
}

function analysis(
  id: string,
  mediaId: string,
  createdAt: string,
  overrides: Partial<AnalysisFixture> = {}
): AnalysisFixture {
  return {
    id,
    media_id: mediaId,
    job_id: `job-${id}`,
    stage: "finishing",
    completion_percent: 80,
    risk_level: "high",
    detected_issues: ["Open edge"],
    recommendations: ["Install protection"],
    created_at: createdAt,
    ...overrides,
  };
}

describe("listPersistedImageSiteObservations", () => {
  it("selects the latest durable analysis independently for each project-scoped media", async () => {
    const { supabase, analysisMediaQueries } = makeSupabase({
      media: [
        { id: "media-1", uploaded_at: "2026-09-09T03:00:00+02:00" },
        { id: "media-2", uploaded_at: "2026-09-08T00:00:00Z" },
      ],
      analyses: [
        analysis("a1-new", "media-1", "2026-09-09T01:00:00Z"),
        analysis("a1-old", "media-1", "2026-09-08T01:00:00Z"),
        analysis("a2", "media-2", "2026-09-08T02:00:00+00:00", {
          risk_level: "unexpected",
          stage: null,
        }),
      ],
    });

    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
      limit: 10,
    });

    expect(rows.map((row) => row.analysisId)).toEqual(["a1-new", "a2"]);
    expect(analysisMediaQueries).toEqual(["media-1", "media-2"]);
    expect(rows[0]?.observation.evidenceTime).toBe("2026-09-09T01:00:00.000Z");
    expect(rows[0]?.observation.evidenceTimeSemantics).toBe("MEDIA_UPLOADED_AT");
    expect(rows[0]?.observation.limitations).toContain("CAPTURE_TIME_UNVERIFIED");
    expect(rows[0]?.observation.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "PHOTO",
          sourceEntityId: "media-1",
          metadata: expect.objectContaining({
            timestampSemantics: "MEDIA_UPLOADED_AT",
            captureTimeVerified: false,
          }),
        }),
        expect.objectContaining({ type: "DATABASE_STATE", sourceEntityId: "a1-new" }),
      ])
    );
    expect(rows[1]?.observation.riskLevel).toBe("medium");
  });

  it("does not let a long history for one media crowd out another media", async () => {
    const manyMediaOne = Array.from({ length: 60 }, (_, i) =>
      analysis(
        `m1-${i}`,
        "media-1",
        new Date(Date.UTC(2026, 8, 9, 10, 0, 0) - i * 60_000).toISOString()
      )
    );
    const { supabase } = makeSupabase({
      media: [
        { id: "media-1", uploaded_at: "2026-09-09T10:00:00Z" },
        { id: "media-2", uploaded_at: "2026-09-09T09:00:00Z" },
      ],
      analyses: [
        ...manyMediaOne,
        analysis("m2-latest", "media-2", "2026-09-09T09:30:00Z"),
      ],
    });

    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
      limit: 2,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.analysisId).toBe("m1-0");
    expect(rows[1]?.analysisId).toBe("m2-latest");
  });

  it("never substitutes analysis creation time when the media has no usable timestamp", async () => {
    const { supabase } = makeSupabase({
      media: [{ id: "media-1", uploaded_at: null }],
      analyses: [analysis("a1", "media-1", "2026-09-09T01:00:00Z")],
    });

    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
    });

    expect(rows[0]?.observation.insufficientEvidence).toBe(true);
    expect(rows[0]?.observation.evidenceTime).toBeNull();
    expect(rows[0]?.observation.evidenceTimeSemantics).toBeNull();
    expect(rows[0]?.observation.limitations).toContain("MISSING_EVIDENCE_TIME");
    expect(rows[0]?.observation.evidence.some((e) => e.type === "PHOTO")).toBe(false);
    expect(rows[0]?.observation.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "DATABASE_STATE", capturedAt: "2026-09-09T01:00:00.000Z" }),
      ])
    );
  });

  it("fails closed on malformed or impossible persisted analysis timestamps", async () => {
    for (const createdAt of ["not-a-timestamp", "2026-02-31T01:00:00Z"]) {
      const { supabase } = makeSupabase({
        media: [{ id: "media-1", uploaded_at: "2026-09-09T00:00:00Z" }],
        analyses: [analysis("a1", "media-1", createdAt)],
      });

      await expect(
        listPersistedImageSiteObservations(supabase as never, {
          tenantId: "tenant-1",
          projectId: "project-1",
        })
      ).rejects.toMatchObject({
        code: "AGENT_SKILL_FAILED",
        message: "invalid_persisted_timestamp:get_site_observations:analysis",
      });
    }
  });

  it("returns no observations without project media and never queries ai_analysis", async () => {
    const { supabase, analysisMediaQueries } = makeSupabase({ media: [], analyses: [] });
    const rows = await listPersistedImageSiteObservations(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-1",
    });
    expect(rows).toEqual([]);
    expect(analysisMediaQueries).toEqual([]);
  });

  it("fails closed when the scoped media query fails", async () => {
    const { supabase } = makeSupabase({ mediaError: { message: "rls denied" } });
    await expect(
      listPersistedImageSiteObservations(supabase as never, {
        tenantId: "tenant-1",
        projectId: "project-1",
      })
    ).rejects.toBeInstanceOf(AgentError);
  });
});
