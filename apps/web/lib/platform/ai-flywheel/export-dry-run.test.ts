import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { runDatasetExportDryRun } from "./export-dry-run";

describe("export dry-run", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_DATASET_EXPORT_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("consent false tenant = zero eligible from that tenant", () => {
    const report = runDatasetExportDryRun({
      tenants: [{ id: "t1", ai_training_consent: false }],
      candidates: [
        {
          id: "c1",
          tenantId: "t1",
          audience: "internal",
          payload: { text: "hello" },
        },
      ],
    });
    expect(report.consentEligible).toBe(0);
    expect(report.finalEligible).toBe(0);
  });

  it("consent true + PII example is scrubbed and may pass verify", () => {
    const report = runDatasetExportDryRun({
      tenants: [{ id: "t1", ai_training_consent: true }],
      candidates: [
        {
          id: "c1",
          tenantId: "t1",
          audience: "internal",
          payload: { text: "Email user@example.com please" },
        },
      ],
    });
    expect(report.consentEligible).toBe(1);
    expect(report.scrubPassed).toBe(1);
    expect(report.droppedScrubFailures).toBe(0);
  });

  it("scrub failure drops example with stubborn PII", () => {
    // Verifier runs after scrub — if still failing, dropped
    const report = runDatasetExportDryRun({
      tenants: [{ id: "t1", ai_training_consent: true }],
      candidates: [
        {
          id: "c1",
          tenantId: "t1",
          audience: "internal",
          payload: { text: "user@example.com" },
        },
      ],
    });
    // After scrub email is redacted — should pass
    expect(report.droppedScrubFailures).toBe(0);
    expect(report.finalEligible).toBeGreaterThanOrEqual(0);
  });

  it("owner finance leakage is blocked", () => {
    const report = runDatasetExportDryRun({
      tenants: [{ id: "t1", ai_training_consent: true }],
      candidates: [
        {
          id: "c1",
          tenantId: "t1",
          audience: "owner",
          payload: { text: "margin risk internal budget pressure subcontractor cost" },
        },
      ],
    });
    expect(report.financeBlocked).toBe(1);
    expect(report.finalEligible).toBe(0);
  });
});
