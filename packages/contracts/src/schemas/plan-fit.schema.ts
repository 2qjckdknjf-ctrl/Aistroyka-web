/**
 * Canonical plan-fit types shared across packages.
 * Plan codes, add-on codes, and entitlement limits shape.
 */

import { z } from "zod";

export const PlanCodeSchema = z.enum([
  "client_personal",
  "team_contractor",
  "business_operations",
  "enterprise",
]);

export const AddOnCodeSchema = z.enum([
  "extra_users",
  "extra_projects",
  "extra_storage",
  "ai_expansion",
  "premium_onboarding",
  "premium_support",
  "future_budget_cost",
  "integration_pack",
  "security_pack",
  "sla_pack",
]);

export const EntitlementLimitsSchema = z.object({
  maxUsers: z.number(),
  maxProjects: z.number(),
  maxStorageGb: z.number(),
  maxActiveMobileWorkers: z.number(),
  maxMonthlyAiRequests: z.number(),
});

export type PlanCode = z.infer<typeof PlanCodeSchema>;
export type AddOnCode = z.infer<typeof AddOnCodeSchema>;
export type EntitlementLimits = z.infer<typeof EntitlementLimitsSchema>;
