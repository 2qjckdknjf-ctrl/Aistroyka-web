/**
 * Application-layer capability resolution: from workspace plan context to runtime snapshot.
 * Orchestrates canonical capability layer; no direct tier checks.
 */

import type { WorkspacePlanContext } from "./workspace-plan-context.types";
import type { PlanEntitlement } from "./entitlements.types";
import { getWorkspaceCapabilities } from "./capability";
import type { CapabilityInput } from "./capability.types";

export interface WorkspaceCapabilitySnapshot {
  limits: PlanEntitlement["limits"];
  capabilities: PlanEntitlement["capabilities"];
}

/**
 * Resolve runtime capability snapshot from workspace plan context.
 * Use this in app/API layer; capabilities are derived from effective entitlements only.
 */
export function resolveWorkspaceCapabilities(
  context: WorkspacePlanContext
): WorkspaceCapabilitySnapshot {
  const input: CapabilityInput = {
    planCode: context.canonicalPlanCode,
    entitlements: context.effectiveEntitlements,
    usage: context.usageSnapshot,
  };
  return getWorkspaceCapabilities(input);
}
