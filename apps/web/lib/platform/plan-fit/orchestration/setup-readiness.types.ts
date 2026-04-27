/**
 * Setup readiness v2 (Step 7).
 * Richer model: checkpoints, completed/missing steps, next action.
 * Legacy-safe: operational workspaces with projects are not blocked.
 */

export type SetupCheckpoint =
  | "first_project_created"
  | "workspace_name_set"
  | "has_invited_or_collaborator";

export type SetupReadinessKindV2 =
  | "setup_missing"
  | "setup_incomplete"
  | "minimally_ready"
  | "ready_for_dashboard";

export type SetupNextActionKey =
  | "create_first_project"
  | "set_workspace_name"
  | "invite_team"
  | "open_dashboard"
  | "none";

export interface SetupReadinessV2 {
  kind: SetupReadinessKindV2;
  projectCount: number;
  completedSteps: SetupCheckpoint[];
  missingSteps: SetupCheckpoint[];
  nextActionKey: SetupNextActionKey;
  targetRoute: string | null;
  notes?: string[];
}
