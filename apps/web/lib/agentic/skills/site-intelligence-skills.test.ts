import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentExecutionContext } from "../types";
import { createSiteIntelligenceSkills } from "./site-intelligence-skills";

const listPersistedImageSiteObservations = vi.fn();

vi.mock("../site-intelligence/site-observation.repository", () => ({
  listPersistedImageSiteObservations: (...args: unknown[]) =>
    listPersistedImageSiteObservations(...args),
}));

function ctx(): AgentExecutionContext {
  return {
    tenantId: "tenant-1",
    projectId: "project-1",
    userId: "user-1",
    actorType: "user",
    tenantRole: "member",
    projectRole: "manager",
    roles: ["manager"],
    permissions: ["read"],
    requestId: "req-1",
    traceId: "trace-1",
    locale: "en",
    source: "WEB",
    timestamp: "2026-09-09T00:00:00.000Z",
  };
}

function persistedObservation(insufficientEvidence = false) {
  return {
    analysisId: "analysis-1",
    jobId: "job-1",
    analysisCreatedAt: "2026-09-09T00:00:00.000Z",
    observation: {
      schemaVersion: 3,
      source: "IMAGE_ANALYSIS",
      projectId: "project-1",
      mediaId: "media-1",
      workDate: null,
      stage: "finishing",
      completionPercent: 80,
      riskLevel: "high",
      observations: [
        { kind: "ISSUE", text: "Open edge", sourceField: "detected_issues" },
      ],
      recommendations: ["Install protection"],
      limitations: insufficientEvidence
        ? ["MISSING_EVIDENCE_TIME"]
        : ["CAPTURE_TIME_UNVERIFIED"],
      evidenceTime: insufficientEvidence ? null : "2026-09-09T00:00:00.000Z",
      evidenceTimeSemantics: insufficientEvidence ? null : "MEDIA_UPLOADED_AT",
      evidence: [
        {
          evidenceId: "DATABASE_STATE:analysis-1",
          type: "DATABASE_STATE",
          sourceEntityType: "ai_analysis",
          sourceEntityId: "analysis-1",
          sourceUrl: null,
          storageObject: null,
          capturedAt: "2026-09-09T00:00:00.000Z",
          metadata: {},
        },
        ...(insufficientEvidence
          ? []
          : [
              {
                evidenceId: "PHOTO:media-1",
                type: "PHOTO",
                sourceEntityType: "media",
                sourceEntityId: "media-1",
                sourceUrl: null,
                storageObject: null,
                capturedAt: "2026-09-09T00:00:00.000Z",
                metadata: {
                  timestampSemantics: "MEDIA_UPLOADED_AT",
                  captureTimeVerified: false,
                },
              },
            ]),
      ],
      insufficientEvidence,
    },
  };
}

describe("get_site_observations skill", () => {
  beforeEach(() => {
    listPersistedImageSiteObservations.mockReset();
  });

  it("returns bounded persistent observations and exposes timestamp semantics", async () => {
    listPersistedImageSiteObservations.mockResolvedValueOnce([persistedObservation(false)]);

    const skill = createSiteIntelligenceSkills({} as never)[0]!;
    const result = await skill.execute(ctx(), {});

    expect(listPersistedImageSiteObservations).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: "tenant-1", projectId: "project-1" })
    );
    expect(result.insufficientEvidence).toBe(false);
    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "PHOTO", sourceEntityId: "media-1" }),
        expect.objectContaining({ type: "DATABASE_STATE", sourceEntityId: "analysis-1" }),
      ])
    );
    expect(result.output).toMatchObject({
      count: 1,
      withheldForInsufficientProvenance: 0,
      items: [
        expect.objectContaining({
          evidenceTime: "2026-09-09T00:00:00.000Z",
          evidenceTimeSemantics: "MEDIA_UPLOADED_AT",
          limitations: ["CAPTURE_TIME_UNVERIFIED"],
        }),
      ],
    });
  });

  it("withholds model-derived site facts when evidence time provenance is missing", async () => {
    listPersistedImageSiteObservations.mockResolvedValueOnce([persistedObservation(true)]);

    const skill = createSiteIntelligenceSkills({} as never)[0]!;
    const result = await skill.execute(ctx(), {});

    expect(result.insufficientEvidence).toBe(true);
    expect(result.evidence).toEqual([]);
    expect(result.output).toMatchObject({
      count: 0,
      withheldForInsufficientProvenance: 1,
      items: [],
    });
  });

  it("reports insufficient evidence when no persisted observations exist", async () => {
    listPersistedImageSiteObservations.mockResolvedValueOnce([]);
    const skill = createSiteIntelligenceSkills({} as never)[0]!;
    const result = await skill.execute(ctx(), {});
    expect(result.insufficientEvidence).toBe(true);
    expect(result.evidence).toEqual([]);
  });
});
