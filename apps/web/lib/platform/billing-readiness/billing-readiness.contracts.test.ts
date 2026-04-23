import { describe, expect, it } from "vitest";
import {
  CreateCheckoutSessionRequestSchema,
  CreateCheckoutSessionResponseSchema,
  BillingOverviewResponseSchema,
} from "./billing-readiness.contracts";

describe("billing-readiness contracts", () => {
  describe("CreateCheckoutSessionRequestSchema", () => {
    it("accepts valid request", () => {
      const result = CreateCheckoutSessionRequestSchema.safeParse({
        targetPlanCode: "team_contractor",
        billingCycle: "monthly",
        returnUrl: "https://app.example.com/success",
        cancelUrl: "https://app.example.com/cancel",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid plan code", () => {
      const result = CreateCheckoutSessionRequestSchema.safeParse({
        targetPlanCode: "invalid",
        returnUrl: "https://app.example.com/success",
        cancelUrl: "https://app.example.com/cancel",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL", () => {
      const result = CreateCheckoutSessionRequestSchema.safeParse({
        targetPlanCode: "team_contractor",
        returnUrl: "not-a-url",
        cancelUrl: "https://app.example.com/cancel",
      });
      expect(result.success).toBe(false);
    });

    it("defaults billingCycle to monthly", () => {
      const result = CreateCheckoutSessionRequestSchema.safeParse({
        targetPlanCode: "team_contractor",
        returnUrl: "https://app.example.com/success",
        cancelUrl: "https://app.example.com/cancel",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.billingCycle).toBe("monthly");
      }
    });
  });

  describe("CreateCheckoutSessionResponseSchema", () => {
    it("accepts readiness placeholder response", () => {
      const result = CreateCheckoutSessionResponseSchema.safeParse({
        checkoutSessionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "created",
        providerKind: "none",
        message: "Readiness placeholder",
        mode: "readiness_placeholder",
      });
      expect(result.success).toBe(true);
    });

    it("accepts response without redirectUrl", () => {
      const result = CreateCheckoutSessionResponseSchema.safeParse({
        checkoutSessionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "created",
        providerKind: "none",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("BillingOverviewResponseSchema", () => {
    it("accepts overview with no subscription", () => {
      const result = BillingOverviewResponseSchema.safeParse({
        selectedPlan: {
          canonicalPlanCode: "client_personal",
          sourceKind: "manual_backend_set",
          selectedAt: "2026-03-19T12:00:00Z",
        },
        billingSubscription: null,
        trialState: null,
        readinessFlags: {
          checkoutEnabled: false,
          billingConnected: false,
          hasActiveSubscription: false,
        },
        allowedActions: ["view_plan", "explore_options"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts overview with subscription", () => {
      const result = BillingOverviewResponseSchema.safeParse({
        selectedPlan: {
          canonicalPlanCode: "team_contractor",
          sourceKind: "recommendation_selected",
        },
        billingSubscription: {
          status: "active",
          billingProvider: "stripe",
          canonicalPlanCode: "team_contractor",
          currentPeriodEnd: "2026-04-19T00:00:00Z",
        },
        trialState: null,
        readinessFlags: {
          checkoutEnabled: false,
          billingConnected: true,
          hasActiveSubscription: true,
        },
        allowedActions: ["view_plan", "explore_options"],
      });
      expect(result.success).toBe(true);
    });
  });
});
