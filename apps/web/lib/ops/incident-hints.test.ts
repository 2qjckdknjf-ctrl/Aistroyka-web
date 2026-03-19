import { describe, expect, it } from "vitest";
import { buildIncidentHints } from "./incident-hints";

describe("buildIncidentHints", () => {
  it("returns empty array when no signals", () => {
    const out = buildIncidentHints({
      errorRateWindow: 0.1,
      errorsByProvider: {},
      failedJobCount: 0,
      dominantJobType: null,
      uploadsStuck: 0,
    });
    expect(out).toEqual([]);
  });

  it("adds ai_runtime_failure_cluster when error rate >= 0.2", () => {
    const out = buildIncidentHints({
      errorRateWindow: 0.25,
      errorsByProvider: {},
      failedJobCount: 0,
      dominantJobType: null,
      uploadsStuck: 0,
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("ai_runtime_failure_cluster");
    expect(out[0]).toContain("runbook");
  });

  it("adds ai_provider hint when errorsByProvider non-empty", () => {
    const out = buildIncidentHints({
      errorRateWindow: null,
      errorsByProvider: { gemini: 5, openai: 1 },
      failedJobCount: 0,
      dominantJobType: null,
      uploadsStuck: 0,
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("ai_provider");
    expect(out[0]).toContain("gemini");
  });

  it("adds cron_job_failure hint with dominant type", () => {
    const out = buildIncidentHints({
      errorRateWindow: null,
      errorsByProvider: {},
      failedJobCount: 3,
      dominantJobType: "ai_analyze_media",
      uploadsStuck: 0,
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("cron_job_failure");
    expect(out[0]).toContain("3 failed job(s)");
    expect(out[0]).toContain("ai_analyze_media");
  });

  it("adds upload_media hint when uploadsStuck > 0", () => {
    const out = buildIncidentHints({
      errorRateWindow: null,
      errorsByProvider: {},
      failedJobCount: 0,
      dominantJobType: null,
      uploadsStuck: 2,
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("upload_media");
    expect(out[0]).toContain("uploads_stuck");
  });

  it("combines multiple hints when multiple signals present", () => {
    const out = buildIncidentHints({
      errorRateWindow: 0.5,
      errorsByProvider: { openai: 10 },
      failedJobCount: 2,
      dominantJobType: "upload_reconcile",
      uploadsStuck: 1,
    });
    expect(out).toHaveLength(4);
    expect(out.some((s) => s.includes("ai_runtime_failure_cluster"))).toBe(true);
    expect(out.some((s) => s.includes("ai_provider") && s.includes("openai"))).toBe(true);
    expect(out.some((s) => s.includes("cron_job_failure") && s.includes("upload_reconcile"))).toBe(true);
    expect(out.some((s) => s.includes("upload_media"))).toBe(true);
  });
});
