import { afterEach, describe, expect, it, vi } from "vitest";

describe("isDashboardSubscriptionGateEnforced", () => {
  afterEach(() => {
    delete process.env.SUBSCRIPTION_GATE_DASHBOARD;
    vi.resetModules();
  });

  it("defaults to enforced when env is unset", async () => {
    const { isDashboardSubscriptionGateEnforced } = await import("./subscription-gate");
    expect(isDashboardSubscriptionGateEnforced()).toBe(true);
  });

  it("relax when SUBSCRIPTION_GATE_DASHBOARD=pilot", async () => {
    process.env.SUBSCRIPTION_GATE_DASHBOARD = "pilot";
    vi.resetModules();
    const { isDashboardSubscriptionGateEnforced } = await import("./subscription-gate");
    expect(isDashboardSubscriptionGateEnforced()).toBe(false);
  });

  it("relax when value is off with whitespace (trim + lower)", async () => {
    process.env.SUBSCRIPTION_GATE_DASHBOARD = " OFF ";
    vi.resetModules();
    const { isDashboardSubscriptionGateEnforced } = await import("./subscription-gate");
    expect(isDashboardSubscriptionGateEnforced()).toBe(false);
  });
});

describe("dashboardAccessFromBillingAndPilot", () => {
  it("allows dashboard when either subscription or pilot cohort is true", async () => {
    const { dashboardAccessFromBillingAndPilot } = await import("./subscription-gate");
    expect(dashboardAccessFromBillingAndPilot(true, false)).toBe(true);
    expect(dashboardAccessFromBillingAndPilot(false, true)).toBe(true);
    expect(dashboardAccessFromBillingAndPilot(true, true)).toBe(true);
    expect(dashboardAccessFromBillingAndPilot(false, false)).toBe(false);
  });
});

describe("hasPaidAccessFromBillingAndTier", () => {
  it("allows active/trialing billing regardless of tier row", async () => {
    const { hasPaidAccessFromBillingAndTier } = await import("./subscription-gate");
    expect(hasPaidAccessFromBillingAndTier("active", "FREE")).toBe(true);
    expect(hasPaidAccessFromBillingAndTier("trialing", null)).toBe(true);
  });

  it("denies when Stripe billing is known inactive even if entitlements tier is still PRO", async () => {
    const { hasPaidAccessFromBillingAndTier } = await import("./subscription-gate");
    expect(hasPaidAccessFromBillingAndTier("canceled", "PRO")).toBe(false);
    expect(hasPaidAccessFromBillingAndTier("past_due", "ENTERPRISE")).toBe(false);
    expect(hasPaidAccessFromBillingAndTier("unpaid", "PRO")).toBe(false);
  });

  it("allows manual paid-tier grant when there is no billing row", async () => {
    const { hasPaidAccessFromBillingAndTier } = await import("./subscription-gate");
    expect(hasPaidAccessFromBillingAndTier(null, "PRO")).toBe(true);
    expect(hasPaidAccessFromBillingAndTier(null, "ENTERPRISE")).toBe(true);
    expect(hasPaidAccessFromBillingAndTier(null, "FREE")).toBe(false);
    expect(hasPaidAccessFromBillingAndTier(null, null)).toBe(false);
  });
});
