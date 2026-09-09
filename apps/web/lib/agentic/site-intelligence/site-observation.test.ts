import { describe, expect, it } from "vitest";
import {
  isSiteObservationProjectionEligible,
  normalizeImageSiteObservation,
  normalizeVideoDailySiteObservation,
} from "./site-observation";

describe("site observation normalization", () => {
  it("normalizes image output with verified capture-time semantics", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: " finishing ",
        completion_percent: 108.6,
        risk_level: "medium",
        detected_issues: ["  Missing guardrail  ", "missing guardrail", ""],
        recommendations: ["Install guardrail", "Install guardrail"],
      },
      {
        projectId: " project-1 ",
        mediaId: " media-1 ",
        capturedAt: "2026-09-09T01:00:00.000Z",
      }
    );

    expect(observation.schemaVersion).toBe(3);
    expect(observation.projectId).toBe("project-1");
    expect(observation.mediaId).toBe("media-1");
    expect(observation.evidenceTime).toBe("2026-09-09T01:00:00.000Z");
    expect(observation.evidenceTimeSemantics).toBe("CAPTURED_AT");
    expect(observation.stage).toBe("finishing");
    expect(observation.completionPercent).toBe(100);
    expect(observation.observations).toEqual([
      { kind: "ISSUE", text: "Missing guardrail", sourceField: "detected_issues" },
    ]);
    expect(observation.recommendations).toEqual(["Install guardrail"]);
    expect(observation.observations.some((s) => s.kind === ("ROOM" as never))).toBe(false);
    expect(observation.evidence).toHaveLength(1);
    expect(observation.evidence[0]).toMatchObject({
      type: "PHOTO",
      sourceEntityType: "media",
      sourceEntityId: "media-1",
      capturedAt: "2026-09-09T01:00:00.000Z",
      metadata: {
        timestampSemantics: "CAPTURED_AT",
        captureTimeVerified: true,
      },
    });
    expect(observation.insufficientEvidence).toBe(false);
    expect(isSiteObservationProjectionEligible(observation)).toBe(true);
  });

  it("uses legacy media upload time only as database-state evidence", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: "finishing",
        completion_percent: 80,
        risk_level: "medium",
        detected_issues: ["Open edge"],
        recommendations: [],
      },
      {
        projectId: "project-1",
        mediaId: "media-1",
        uploadedAt: "2026-09-09T03:00:00+02:00",
      }
    );

    expect(observation.evidenceTime).toBe("2026-09-09T01:00:00.000Z");
    expect(observation.evidenceTimeSemantics).toBe("MEDIA_UPLOADED_AT");
    expect(observation.limitations).toContain("CAPTURE_TIME_UNVERIFIED");
    expect(observation.evidence[0]).toMatchObject({
      type: "DATABASE_STATE",
      sourceEntityType: "media",
      sourceEntityId: "media-1",
      capturedAt: "2026-09-09T01:00:00.000Z",
      metadata: {
        timestampSemantics: "MEDIA_UPLOADED_AT",
        captureTimeVerified: false,
      },
    });
    expect(observation.evidence.some((e) => e.type === "PHOTO" || e.type === "VIDEO")).toBe(false);
    expect(observation.insufficientEvidence).toBe(false);
    expect(isSiteObservationProjectionEligible(observation)).toBe(false);
  });

  it("keeps observed video signals separate from recommendations", () => {
    const observation = normalizeVideoDailySiteObservation(
      {
        work_date: "2026-09-09",
        summary: "Partition framing progressed.",
        activities_observed: ["Framing partitions", " framing partitions "],
        materials_or_equipment_visible: ["Metal studs"],
        completion_estimate_percent: 41.6,
        risk_level: "high",
        issues_and_risks: ["Open edge"],
        recommendations: ["Install edge protection"],
        visibility_notes: "Camera view partially occluded",
      },
      {
        projectId: "project-1",
        mediaId: "video-1",
        capturedAt: "2026-09-09T08:30:00+02:00",
      }
    );

    expect(observation.workDate).toBe("2026-09-09");
    expect(observation.completionPercent).toBe(42);
    expect(observation.observations).toEqual([
      { kind: "ACTIVITY", text: "Framing partitions", sourceField: "activities_observed" },
      { kind: "MATERIAL", text: "Metal studs", sourceField: "materials_or_equipment_visible" },
      { kind: "ISSUE", text: "Open edge", sourceField: "issues_and_risks" },
      { kind: "VISIBILITY", text: "Camera view partially occluded", sourceField: "visibility_notes" },
    ]);
    expect(observation.recommendations).toEqual(["Install edge protection"]);
    expect(observation.evidence[0]?.type).toBe("VIDEO");
    expect(observation.insufficientEvidence).toBe(false);
  });

  it("fails projection eligibility when project or media provenance is missing", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: "unknown",
        completion_percent: 20,
        risk_level: "low",
        detected_issues: [],
        recommendations: [],
      },
      { projectId: null, mediaId: null }
    );

    expect(observation.stage).toBeNull();
    expect(observation.evidence).toEqual([]);
    expect(observation.limitations).toEqual([
      "UNSCOPED_PROJECT",
      "MISSING_MEDIA_EVIDENCE",
      "MISSING_EVIDENCE_TIME",
    ]);
    expect(observation.insufficientEvidence).toBe(true);
    expect(isSiteObservationProjectionEligible(observation)).toBe(false);
  });

  it("does not fabricate an evidence timestamp when both capture and upload time are missing", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: "finishing",
        completion_percent: 80,
        risk_level: "medium",
        detected_issues: ["Open edge"],
        recommendations: [],
      },
      { projectId: "project-1", mediaId: "media-1" }
    );

    expect(observation.evidenceTime).toBeNull();
    expect(observation.evidenceTimeSemantics).toBeNull();
    expect(observation.evidence).toEqual([]);
    expect(observation.limitations).toContain("MISSING_EVIDENCE_TIME");
    expect(observation.insufficientEvidence).toBe(true);
    expect(isSiteObservationProjectionEligible(observation)).toBe(false);
  });

  it("marks an unknown video work date instead of guessing one", () => {
    const observation = normalizeVideoDailySiteObservation(
      {
        work_date: "unknown",
        summary: "Work visible.",
        activities_observed: [],
        completion_estimate_percent: 10,
        risk_level: "low",
        issues_and_risks: [],
        recommendations: [],
      },
      {
        projectId: "project-1",
        mediaId: "video-1",
        capturedAt: "2026-09-09T08:30:00.000Z",
      }
    );

    expect(observation.workDate).toBeNull();
    expect(observation.limitations).toContain("UNKNOWN_WORK_DATE");
  });
});