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

describe("shouldRequireDashboardSubscription", () => {
  it("requires subscription for a non-stakeholder tenant without dashboard access", async () => {
    const { shouldRequireDashboardSubscription } = await import("./subscription-gate");
    expect(
      shouldRequireDashboardSubscription({
        isGateEnforced: true,
        tenantId: "tenant_1",
        hasDashboardAccess: false,
        tenantRole: "owner",
      })
    ).toBe(true);
  });

  it("keeps stakeholder portal users out of the manager billing gate", async () => {
    const { shouldRequireDashboardSubscription } = await import("./subscription-gate");
    expect(
      shouldRequireDashboardSubscription({
        isGateEnforced: true,
        tenantId: "tenant_1",
        hasDashboardAccess: false,
        tenantRole: "stakeholder",
      })
    ).toBe(false);
  });

  it("does not redirect when the gate is disabled or dashboard access exists", async () => {
    const { shouldRequireDashboardSubscription } = await import("./subscription-gate");
    expect(
      shouldRequireDashboardSubscription({
        isGateEnforced: false,
        tenantId: "tenant_1",
        hasDashboardAccess: false,
        tenantRole: "owner",
      })
    ).toBe(false);
    expect(
      shouldRequireDashboardSubscription({
        isGateEnforced: true,
        tenantId: "tenant_1",
        hasDashboardAccess: true,
        tenantRole: "owner",
      })
    ).toBe(false);
  });
});
