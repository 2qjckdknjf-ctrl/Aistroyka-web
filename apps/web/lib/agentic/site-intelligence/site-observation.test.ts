import { describe, expect, it } from "vitest";
import {
  isSiteObservationProjectionEligible,
  normalizeImageSiteObservation,
  normalizeVideoDailySiteObservation,
} from "./site-observation";

const CAPTURED_AT = "2026-09-09T01:00:00.000Z";

describe("site observation normalization", () => {
  it("normalizes image output without inventing physical location facts", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: " finishing ",
        completion_percent: 108.6,
        risk_level: "medium",
        detected_issues: ["  Missing guardrail  ", "missing guardrail", ""],
        recommendations: ["Install guardrail", "Install guardrail"],
      },
      { projectId: " project-1 ", mediaId: " media-1 ", capturedAt: CAPTURED_AT }
    );

    expect(observation.projectId).toBe("project-1");
    expect(observation.mediaId).toBe("media-1");
    expect(observation.stage).toBe("finishing");
    expect(observation.completionPercent).toBe(100);
    expect(observation.observations).toEqual([
      { kind: "ISSUE", text: "Missing guardrail", sourceField: "detected_issues" },
    ]);
    expect(observation.recommendations).toEqual(["Install guardrail"]);
    expect(observation.evidence[0]).toMatchObject({
      type: "PHOTO",
      sourceEntityType: "media",
      sourceEntityId: "media-1",
      capturedAt: CAPTURED_AT,
    });
    expect(observation.insufficientEvidence).toBe(false);
    expect(isSiteObservationProjectionEligible(observation)).toBe(true);
  });

  it("keeps safety-relevant video signals ahead of activities", () => {
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
      { projectId: "project-1", mediaId: "video-1", capturedAt: CAPTURED_AT }
    );

    expect(observation.workDate).toBe("2026-09-09");
    expect(observation.observations).toEqual([
      { kind: "ISSUE", text: "Open edge", sourceField: "issues_and_risks" },
      { kind: "VISIBILITY", text: "Camera view partially occluded", sourceField: "visibility_notes" },
      { kind: "ACTIVITY", text: "Framing partitions", sourceField: "activities_observed" },
      { kind: "MATERIAL", text: "Metal studs", sourceField: "materials_or_equipment_visible" },
    ]);
    expect(observation.recommendations).toEqual(["Install edge protection"]);
  });

  it("preserves hazards when activity/material signals exceed the overall cap", () => {
    const activities = Array.from({ length: 24 }, (_, i) => `Activity ${i + 1}`);
    const materials = Array.from({ length: 24 }, (_, i) => `Material ${i + 1}`);
    const issues = ["Open edge", "Missing guardrail", "Live cable"];

    const observation = normalizeVideoDailySiteObservation(
      {
        work_date: "2026-09-09",
        summary: "Dense site activity.",
        activities_observed: activities,
        materials_or_equipment_visible: materials,
        completion_estimate_percent: 50,
        risk_level: "high",
        issues_and_risks: issues,
        recommendations: [],
        visibility_notes: "North corner occluded",
      },
      { projectId: "project-1", mediaId: "video-1", capturedAt: CAPTURED_AT }
    );

    expect(observation.observations).toHaveLength(32);
    for (const issue of issues) {
      expect(observation.observations).toContainEqual({
        kind: "ISSUE",
        text: issue,
        sourceField: "issues_and_risks",
      });
    }
    expect(observation.observations).toContainEqual({
      kind: "VISIBILITY",
      text: "North corner occluded",
      sourceField: "visibility_notes",
    });
  });

  it("fails projection eligibility when project, media, or capture provenance is missing", () => {
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

    expect(observation.evidence).toEqual([]);
    expect(observation.limitations).toEqual([
      "UNSCOPED_PROJECT",
      "MISSING_MEDIA_EVIDENCE",
      "MISSING_CAPTURE_TIME",
    ]);
    expect(observation.insufficientEvidence).toBe(true);
    expect(isSiteObservationProjectionEligible(observation)).toBe(false);
  });

  it("does not substitute normalization time when capture time is missing", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: "rough_in",
        completion_percent: 20,
        risk_level: "low",
        detected_issues: [],
        recommendations: [],
      },
      { projectId: "project-1", mediaId: "media-1" }
    );

    expect(observation.evidence).toEqual([]);
    expect(observation.limitations).toContain("MISSING_CAPTURE_TIME");
    expect(isSiteObservationProjectionEligible(observation)).toBe(false);
  });

  it("rejects impossible capture timestamps", () => {
    const invalid = normalizeImageSiteObservation(
      {
        stage: "rough_in",
        completion_percent: 20,
        risk_level: "low",
        detected_issues: [],
        recommendations: [],
      },
      { projectId: "project-1", mediaId: "media-1", capturedAt: "2026-02-31T01:00:00Z" }
    );

    expect(invalid.evidence).toEqual([]);
    expect(invalid.limitations).toContain("MISSING_CAPTURE_TIME");
  });

  it("accepts explicit RFC3339 offsets and canonicalizes them to UTC", () => {
    const observation = normalizeImageSiteObservation(
      {
        stage: "rough_in",
        completion_percent: 20,
        risk_level: "low",
        detected_issues: [],
        recommendations: [],
      },
      { projectId: "project-1", mediaId: "media-1", capturedAt: "2026-09-09T03:00:00+02:00" }
    );

    expect(observation.evidence[0]?.capturedAt).toBe("2026-09-09T01:00:00.000Z");
    expect(observation.insufficientEvidence).toBe(false);
  });

  it("marks unknown or impossible video work dates instead of guessing one", () => {
    for (const workDate of ["unknown", "2026-02-31", "2026-99-99"]) {
      const observation = normalizeVideoDailySiteObservation(
        {
          work_date: workDate,
          summary: "Work visible.",
          activities_observed: [],
          completion_estimate_percent: 10,
          risk_level: "low",
          issues_and_risks: [],
          recommendations: [],
        },
        { projectId: "project-1", mediaId: "video-1", capturedAt: CAPTURED_AT }
      );

      expect(observation.workDate).toBeNull();
      expect(observation.limitations).toContain("UNKNOWN_WORK_DATE");
    }
  });
});
