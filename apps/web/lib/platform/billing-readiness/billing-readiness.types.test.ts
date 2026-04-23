import { describe, expect, it } from "vitest";
import type {
  BillingSubscriptionStatus,
  BillingCheckoutSessionStatus,
  BillingProviderKind,
  BillingCycle,
  TrialStatus,
} from "./billing-readiness.types";

describe("billing-readiness types", () => {
  describe("BillingSubscriptionStatus", () => {
    const validStatuses: BillingSubscriptionStatus[] = [
      "pending",
      "trialing",
      "active",
      "past_due",
      "cancelled",
      "expired",
      "incomplete",
      "paused",
      "unknown",
    ];
    it("has expected subscription status values", () => {
      expect(validStatuses).toHaveLength(9);
      expect(validStatuses).toContain("active");
      expect(validStatuses).toContain("cancelled");
    });
  });

  describe("BillingCheckoutSessionStatus", () => {
    const validStatuses: BillingCheckoutSessionStatus[] = [
      "created",
      "pending_redirect",
      "completed",
      "cancelled",
      "expired",
      "failed",
    ];
    it("has expected checkout session status values", () => {
      expect(validStatuses).toHaveLength(6);
      expect(validStatuses).toContain("created");
      expect(validStatuses).toContain("completed");
    });
  });

  describe("BillingProviderKind", () => {
    const validProviders: BillingProviderKind[] = ["none", "stripe", "paddle", "manual", "legacy", "sandbox"];
    it("has expected provider kinds", () => {
      expect(validProviders).toHaveLength(6);
      expect(validProviders).toContain("none");
      expect(validProviders).toContain("sandbox");
    });
  });

  describe("BillingCycle", () => {
    const validCycles: BillingCycle[] = ["monthly", "annual", "custom"];
    it("has expected billing cycles", () => {
      expect(validCycles).toHaveLength(3);
    });
  });

  describe("TrialStatus", () => {
    const validTrialStatuses: TrialStatus[] = [
      "not_started",
      "active",
      "expired",
      "converted",
      "cancelled",
    ];
    it("has expected trial status values", () => {
      expect(validTrialStatuses).toHaveLength(5);
      expect(validTrialStatuses).toContain("active");
      expect(validTrialStatuses).toContain("converted");
    });
  });
});
