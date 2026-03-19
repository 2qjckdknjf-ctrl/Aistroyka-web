import { describe, it, expect } from "vitest";
import { getAlertDestinations } from "./alert-destinations";

describe("getAlertDestinations", () => {
  it("AI types: context_routed + anchored list", () => {
    const d = getAlertDestinations("a1", "job_fail_spike");
    expect(d.linkage).toBe("context_routed");
    expect(d.contextHref).toBe("/dashboard/ai");
    expect(d.contextLabel).toContain("AI");
    expect(d.anchoredListHref).toBe("/dashboard/alerts#alert-a1");
    expect(d.honestyNote).toBeNull();
  });

  it("slo_breach: dashboard context", () => {
    const d = getAlertDestinations("x", "slo_breach");
    expect(d.contextHref).toBe("/dashboard");
    expect(d.linkage).toBe("context_routed");
  });

  it("quota_spike: dashboard with usage hint", () => {
    const d = getAlertDestinations("x", "quota_spike");
    expect(d.contextLabel).toContain("usage");
  });

  it("unknown type: list_anchor_only, no context, honesty note", () => {
    const d = getAlertDestinations("u", "custom_future_type");
    expect(d.linkage).toBe("list_anchor_only");
    expect(d.contextHref).toBeNull();
    expect(d.contextLabel).toBeNull();
    expect(d.honestyNote).toContain("No dedicated screen");
    expect(d.anchoredListHref).toBe("/dashboard/alerts#alert-u");
  });
});
