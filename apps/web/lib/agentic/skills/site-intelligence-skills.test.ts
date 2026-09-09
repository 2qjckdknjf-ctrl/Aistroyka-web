import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentExecutionContext } from "../types";
import { createSiteIntelligenceSkills } from "./site-intelligence-skills";

const listPersistedImageSiteObservations = vi.fn();
vi.mock("../site-intelligence/site-observation.repository", () => ({
  listPersistedImageSiteObservations: (...args: unknown[]) => listPersistedImageSiteObservations(...args),
}));

const ctx: AgentExecutionContext = {
  tenantId: "t1", projectId: "p1", userId: "u1", actorType: "user", tenantRole: "member",
  projectRole: "manager", roles: ["manager"], permissions: ["read"], requestId: "r1", traceId: "tr1",
  locale: "en", source: "WEB", timestamp: "2026-09-09T00:00:00.000Z",
};

function row(insufficientEvidence: boolean) {
  return {
    analysisId: "a1", jobId: "j1", analysisCreatedAt: "2026-09-09T00:00:00.000Z",
    observation: {
      schemaVersion: 2, source: "IMAGE_ANALYSIS", projectId: "p1", mediaId: "m1", workDate: null,
      stage: "finishing", completionPercent: 80, riskLevel: "high",
      observations: [{ kind: "ISSUE", text: "Open edge", sourceField: "detected_issues" }],
      recommendations: [], limitations: insufficientEvidence ? ["MISSING_CAPTURE_TIME"] : [],
      evidence: insufficientEvidence ? [{ evidenceId: "DATABASE_STATE:a1", type: "DATABASE_STATE", sourceEntityType: "ai_analysis", sourceEntityId: "a1", sourceUrl: null, storageObject: null, capturedAt: "2026-09-09T00:00:00.000Z", metadata: {} }] : [{ evidenceId: "PHOTO:m1", type: "PHOTO", sourceEntityType: "media", sourceEntityId: "m1", sourceUrl: null, storageObject: null, capturedAt: "2026-09-09T00:00:00.000Z", metadata: {} }],
      insufficientEvidence,
    },
  };
}

describe("get_site_observations", () => {
  beforeEach(() => listPersistedImageSiteObservations.mockReset());

  it("surfaces only observations with complete media provenance", async () => {
    listPersistedImageSiteObservations.mockResolvedValueOnce([row(false), row(true)]);
    const result = await createSiteIntelligenceSkills({} as never)[0]!.execute(ctx, {});
    expect(result.insufficientEvidence).toBe(false);
    expect(result.output).toMatchObject({ count: 1, withheldForInsufficientProvenance: 1 });
    expect(result.evidence).toHaveLength(1);
  });

  it("fails evidence sufficiency when all persisted rows lack capture provenance", async () => {
    listPersistedImageSiteObservations.mockResolvedValueOnce([row(true)]);
    const result = await createSiteIntelligenceSkills({} as never)[0]!.execute(ctx, {});
    expect(result.insufficientEvidence).toBe(true);
    expect(result.evidence).toEqual([]);
    expect(result.output).toMatchObject({ count: 0, withheldForInsufficientProvenance: 1, items: [] });
  });
});
