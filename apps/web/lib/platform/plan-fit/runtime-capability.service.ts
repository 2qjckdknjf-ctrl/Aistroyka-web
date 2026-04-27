/**
 * Server-side capability access from runtime: get snapshot from current workspace data.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkspacePlanContextFromRuntime } from "./runtime-plan-context.service";
import { resolveWorkspaceCapabilities } from "./application-capability";
import type { WorkspaceCapabilitySnapshot } from "./application-capability";
import type { GetWorkspacePlanContextFromRuntimeOptions } from "./runtime-plan-context.service";

/**
 * Get effective capability snapshot for a workspace from runtime (DB/adapter).
 * Use on server when you have supabase + workspaceId (tenantId).
 */
export async function getWorkspaceCapabilitiesFromRuntime(
  supabase: SupabaseClient,
  workspaceId: string,
  options?: GetWorkspacePlanContextFromRuntimeOptions
): Promise<WorkspaceCapabilitySnapshot> {
  const context = await getWorkspacePlanContextFromRuntime(supabase, workspaceId, options);
  return resolveWorkspaceCapabilities(context);
}

/** Thrown when a required capability is not available for the workspace. */
export class WorkspaceCapabilityRequiredError extends Error {
  constructor(
    public readonly capabilityKey: string,
    message?: string
  ) {
    super(message ?? `Workspace does not have capability: ${capabilityKey}`);
    this.name = "WorkspaceCapabilityRequiredError";
  }
}

/**
 * Ensure workspace has a capability; throws WorkspaceCapabilityRequiredError if not.
 * Use for server-side guard clauses. Prefer getWorkspaceCapabilitiesFromRuntime when you only need to read.
 */
export async function requireWorkspaceCapability(
  supabase: SupabaseClient,
  workspaceId: string,
  capabilityKey: keyof WorkspaceCapabilitySnapshot["capabilities"],
  options?: GetWorkspacePlanContextFromRuntimeOptions
): Promise<WorkspaceCapabilitySnapshot> {
  const snapshot = await getWorkspaceCapabilitiesFromRuntime(supabase, workspaceId, options);
  const value = snapshot.capabilities[capabilityKey];
  if (value !== true) {
    throw new WorkspaceCapabilityRequiredError(capabilityKey);
  }
  return snapshot;
}
