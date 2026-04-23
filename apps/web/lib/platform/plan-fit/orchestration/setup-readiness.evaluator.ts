/**
 * Setup readiness for plan-fit orchestration (Step 5, extended Step 7).
 * V2: richer model with checkpoints, completed/missing steps, next action.
 * Legacy-safe: operational workspaces with projects are not blocked.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SetupReadiness } from "./orchestration.types";
import type {
  SetupReadinessV2,
  SetupCheckpoint,
  SetupNextActionKey,
} from "./setup-readiness.types";

/**
 * Evaluate setup readiness for a tenant (legacy simple model).
 * Kept for backward compatibility; prefer evaluateSetupReadinessV2.
 */
export async function evaluateSetupReadiness(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SetupReadiness> {
  const v2 = await evaluateSetupReadinessV2(supabase, tenantId);
  const setupReady = v2.kind === "ready_for_dashboard" || v2.kind === "minimally_ready";
  return {
    kind: setupReady ? "ready_for_dashboard" : "setup_incomplete",
    projectCount: v2.projectCount,
  };
}

/**
 * Evaluate setup readiness v2 with checkpoints.
 * Checkpoints: first_project_created, workspace_name_set, has_invited_or_collaborator.
 * Legacy shortcut: projectCount > 0 → minimally_ready or ready_for_dashboard (never block).
 */
export async function evaluateSetupReadinessV2(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SetupReadinessV2> {
  const [projectsRes, tenantRes, membersRes, invitationsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
    supabase
      .from("tenant_members")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("tenant_invitations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  const projectCount = projectsRes.error ? 0 : (projectsRes.count ?? 0);
  const tenantName = (tenantRes.data as { name?: string | null } | null)?.name ?? null;
  const memberCount = membersRes.error ? 0 : (membersRes.count ?? 0);
  const invitationCount = invitationsRes.error ? 0 : (invitationsRes.count ?? 0);

  const hasProject = projectCount > 0;
  const hasWorkspaceName =
    typeof tenantName === "string" && tenantName.trim().length > 0;
  const hasInvitedOrCollaborator = memberCount > 1 || invitationCount > 0;

  const completedSteps: SetupCheckpoint[] = [];
  const missingSteps: SetupCheckpoint[] = [];

  if (hasProject) completedSteps.push("first_project_created");
  else missingSteps.push("first_project_created");

  if (hasWorkspaceName) completedSteps.push("workspace_name_set");
  else missingSteps.push("workspace_name_set");

  if (hasInvitedOrCollaborator) completedSteps.push("has_invited_or_collaborator");
  else missingSteps.push("has_invited_or_collaborator");

  let kind: SetupReadinessV2["kind"];
  let nextActionKey: SetupNextActionKey;

  if (!hasProject) {
    kind = hasWorkspaceName ? "setup_incomplete" : "setup_missing";
    nextActionKey = "create_first_project";
  } else if (!hasWorkspaceName) {
    kind = "minimally_ready";
    nextActionKey = "set_workspace_name";
  } else if (!hasInvitedOrCollaborator) {
    kind = "minimally_ready";
    nextActionKey = "invite_team";
  } else {
    kind = "ready_for_dashboard";
    nextActionKey = "open_dashboard";
  }

  const targetRoute = getTargetRouteForAction(nextActionKey);

  return {
    kind,
    projectCount,
    completedSteps,
    missingSteps,
    nextActionKey,
    targetRoute,
  };
}

function getTargetRouteForAction(action: SetupNextActionKey): string | null {
  switch (action) {
    case "create_first_project":
      return "/projects/new";
    case "invite_team":
      return "/team";
    case "set_workspace_name":
      return "/team";
    case "open_dashboard":
      return "/dashboard";
    case "none":
      return null;
    default:
      return null;
  }
}
