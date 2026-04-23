/**
 * Billing readiness API contracts (Step 12).
 * Transport-safe request/response schemas.
 * No real checkout; placeholder responses only.
 */

import { z } from "zod";
import { PlanCodeSchema } from "@aistroyka/contracts";

// ─── Create checkout session ─────────────────────────────────────────────────

export const CreateCheckoutSessionRequestSchema = z.object({
  targetPlanCode: PlanCodeSchema,
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionRequestSchema>;

export const CreateCheckoutSessionResponseSchema = z.object({
  checkoutSessionId: z.string().uuid(),
  status: z.enum(["created", "pending_redirect", "completed", "cancelled", "expired", "failed"]),
  redirectUrl: z.string().url().optional(),
  providerKind: z.enum(["none", "stripe", "paddle", "manual", "legacy", "sandbox"]),
  message: z.string().optional(),
  mode: z
    .enum([
      "readiness_placeholder",
      "sandbox_simulation",
      "real_checkout",
      "provider_disabled_fallback",
      "provider_ready_stub",
      "provider_live_checkout",
    ])
    .optional(),
});

export type CreateCheckoutSessionResponse = z.infer<typeof CreateCheckoutSessionResponseSchema>;

// ─── Billing overview ───────────────────────────────────────────────────────

export const BillingOverviewResponseSchema = z.object({
  selectedPlan: z.object({
    canonicalPlanCode: PlanCodeSchema,
    sourceKind: z.string(),
    selectedAt: z.string().optional(),
  }),
  billingSubscription: z
    .object({
      status: z.string(),
      billingProvider: z.string(),
      canonicalPlanCode: PlanCodeSchema.optional(),
      currentPeriodEnd: z.string().nullable().optional(),
    })
    .nullable(),
  trialState: z
    .object({
      status: z.string(),
      endsAt: z.string().optional(),
      trialPlanCode: PlanCodeSchema.optional(),
    })
    .nullable(),
  readinessFlags: z.object({
    checkoutEnabled: z.boolean(),
    sandboxMode: z.boolean().optional(),
    billingConnected: z.boolean(),
    hasActiveSubscription: z.boolean(),
    activeAdapterKind: z.string().optional(),
    providerConfigured: z.boolean().optional(),
    liveCheckoutEnabled: z.boolean().optional(),
    checkoutMode: z.enum(["sandbox", "provider_stub", "provider_live"]).optional(),
    inPilotCohort: z.boolean().optional(),
    pilotReason: z.string().optional(),
  }),
  allowedActions: z.array(z.string()),
  planSurfaceSummary: z
    .object({
      currentPlanCode: PlanCodeSchema,
      humanReadablePlanName: z.string(),
    })
    .optional(),
});

export type BillingOverviewResponse = z.infer<typeof BillingOverviewResponseSchema>;

// ─── Billing state (domain-centric) ───────────────────────────────────────────

export const BillingStateResponseSchema = z.object({
  workspaceId: z.string().uuid(),
  selectedPlanCode: PlanCodeSchema.nullable(),
  billingSubscriptionId: z.string().uuid().nullable(),
  billingSubscriptionStatus: z.string().nullable(),
  trialStatus: z.string().nullable(),
  checkoutAvailable: z.boolean(),
});

export type BillingStateResponse = z.infer<typeof BillingStateResponseSchema>;
