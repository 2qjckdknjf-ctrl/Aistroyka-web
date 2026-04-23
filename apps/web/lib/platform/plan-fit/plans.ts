/**
 * Canonical plan model: codes and labels.
 */

import type { PlanCode } from "@aistroyka/contracts";
import { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";
import type { PlanEntitlement } from "./entitlements.types";

export const PLAN_CODE_LABELS: Record<PlanCode, string> = {
  client_personal: "Client Personal",
  team_contractor: "Team Contractor",
  business_operations: "Business Operations",
  enterprise: "Enterprise",
};

/** Get canonical entitlements for a plan code. */
export function getPlanEntitlements(planCode: PlanCode): PlanEntitlement {
  const ent = PLAN_ENTITLEMENTS_DEFAULTS[planCode];
  return {
    limits: { ...ent.limits },
    capabilities: { ...ent.capabilities },
  };
}
