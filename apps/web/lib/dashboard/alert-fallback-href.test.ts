import { describe, it, expect } from "vitest";
import { getAlertFallbackHref } from "./alert-fallback-href";

describe("getAlertFallbackHref", () => {
  it("returns /dashboard/ai for ai_budget_exceeded", () => {
    expect(getAlertFallbackHref("ai_budget_exceeded")).toBe("/dashboard/ai");
  });

  it("returns /dashboard/ai for ai_budget_soft_exceeded", () => {
    expect(getAlertFallbackHref("ai_budget_soft_exceeded")).toBe("/dashboard/ai");
  });

  it("returns /dashboard/ai for job_fail_spike", () => {
    expect(getAlertFallbackHref("job_fail_spike")).toBe("/dashboard/ai");
  });

  it("returns /dashboard for slo_breach", () => {
    expect(getAlertFallbackHref("slo_breach")).toBe("/dashboard");
  });

  it("returns /dashboard for quota_spike", () => {
    expect(getAlertFallbackHref("quota_spike")).toBe("/dashboard");
  });

  it("returns /dashboard/alerts for unknown type", () => {
    expect(getAlertFallbackHref("unknown_type")).toBe("/dashboard/alerts");
  });
});
