/**
 * Input types for the capability layer.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { PlanEntitlement } from "./entitlements.types";

export interface UsageSnapshot {
  activeUsersCount: number;
  activeProjectsCount: number;
  storageUsedGb: number;
  aiRequestsCount: number;
}

export interface CapabilityInput {
  planCode: PlanCode;
  /** Optional override when workspace has resolved entitlements (e.g. from subscription + add-ons). */
  entitlements?: PlanEntitlement;
  /** Optional usage for limit checks. When absent, limit checks return false (not reached). */
  usage?: UsageSnapshot;
}
