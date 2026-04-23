/**
 * Pure UI decision logic for ContinueWorkspaceSetupScreen (Step 7).
 * Extracted for testability without DOM/React.
 */

import type { SetupReadinessV2, SetupNextActionKey, SetupCheckpoint } from "@/lib/platform/plan-fit/orchestration/setup-readiness.types";

/** Route for each next-action key. set_workspace_name and invite_team → /team. */
export function getTargetRouteForAction(nextActionKey: SetupNextActionKey): string | null {
  switch (nextActionKey) {
    case "create_first_project":
      return "/projects/new";
    case "invite_team":
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

export interface PrimaryCta {
  labelKey: string;
  href: string;
  isOpenDashboard: boolean;
}

const DEFAULT_NEXT_ACTION: SetupNextActionKey = "create_first_project";
const DEFAULT_HREF = "/projects/new";

const CTA_BY_ACTION: Record<SetupNextActionKey, { labelKey: string; href: string }> = {
  create_first_project: { labelKey: "createProject", href: "/projects/new" },
  set_workspace_name: { labelKey: "teamSettings", href: "/team" },
  invite_team: { labelKey: "inviteTeam", href: "/team" },
  open_dashboard: { labelKey: "openDashboard", href: "/dashboard" },
  none: { labelKey: "openDashboard", href: "/dashboard" },
};

/**
 * Get primary CTA for setup detail.
 * Fallback: when setup is null/partial, use create_first_project → /projects/new.
 */
export function getPrimaryCtaForSetup(setup: SetupReadinessV2 | null | undefined): PrimaryCta {
  const nextActionKey = setup?.nextActionKey ?? DEFAULT_NEXT_ACTION;
  const cta = CTA_BY_ACTION[nextActionKey] ?? CTA_BY_ACTION.create_first_project;
  const href = setup?.targetRoute ?? getTargetRouteForAction(nextActionKey) ?? cta.href ?? DEFAULT_HREF;
  const isOpenDashboard = nextActionKey === "open_dashboard" || nextActionKey === "none";
  return {
    labelKey: cta.labelKey,
    href,
    isOpenDashboard,
  };
}

export interface SetupProgressViewModel {
  completedSteps: string[];
  missingSteps: string[];
}

/**
 * Get progress view model from setup detail.
 * Fallback: empty arrays when setup is null/partial.
 */
export function getSetupProgressViewModel(setup: SetupReadinessV2 | null | undefined): SetupProgressViewModel {
  return {
    completedSteps: setup?.completedSteps ?? [],
    missingSteps: setup?.missingSteps ?? [],
  };
}

/** Ordered operational steps for display. */
export const OPERATIONAL_STEP_ORDER: readonly string[] = [
  "workspace_name_set",
  "first_project_created",
  "has_invited_or_collaborator",
] as const;

export interface SetupStepItem {
  key: string;
  labelKey: string;
  descriptionKey: string;
  route: string;
  completed: boolean;
  isRecommended: boolean;
}

/**
 * Build ordered setup checklist for UI.
 * Each step has key, labelKey, descriptionKey, route, completed, isRecommended.
 */
export function getSetupChecklistViewModel(setup: SetupReadinessV2 | null | undefined): SetupStepItem[] {
  const completedSet = new Set(setup?.completedSteps ?? []);
  const nextActionKey = setup?.nextActionKey ?? "create_first_project";

  const stepConfig: Record<string, { labelKey: string; descriptionKey: string; route: string }> = {
    workspace_name_set: {
      labelKey: "setupStep_workspace_name_set",
      descriptionKey: "setupStepDesc_workspace_name_set",
      route: "/team",
    },
    first_project_created: {
      labelKey: "setupStep_first_project_created",
      descriptionKey: "setupStepDesc_first_project_created",
      route: "/projects/new",
    },
    has_invited_or_collaborator: {
      labelKey: "setupStep_has_invited_or_collaborator",
      descriptionKey: "setupStepDesc_has_invited_or_collaborator",
      route: "/team",
    },
  };

  const recommendedByAction: Record<string, string> = {
    set_workspace_name: "workspace_name_set",
    create_first_project: "first_project_created",
    invite_team: "has_invited_or_collaborator",
    open_dashboard: "",
    none: "",
  };
  const recommendedStep = recommendedByAction[nextActionKey] ?? "first_project_created";

  return OPERATIONAL_STEP_ORDER.map((key) => {
    const config = stepConfig[key] ?? { labelKey: key, descriptionKey: key, route: "/dashboard" };
    const k = key as SetupCheckpoint;
    return {
      key,
      labelKey: config.labelKey,
      descriptionKey: config.descriptionKey,
      route: config.route,
      completed: completedSet.has(k),
      isRecommended: key === recommendedStep && !completedSet.has(k),
    };
  });
}

/** Per-step CTA button label key for screen. */
const STEP_BUTTON_LABEL: Record<string, string> = {
  workspace_name_set: "teamSettings",
  first_project_created: "createProject",
  has_invited_or_collaborator: "inviteTeam",
};

export function getStepButtonLabelKey(stepKey: string): string {
  return STEP_BUTTON_LABEL[stepKey] ?? "createProject";
}

/** Subtitle key for continue setup screen based on checklist completion. */
export function getContinueSetupSubtitleKey(checklist: SetupStepItem[]): string {
  const allComplete = checklist.length > 0 && checklist.every((s) => s.completed);
  return allComplete ? "continueSetupReadySubtitle" : "continueSetupSubtitle";
}
