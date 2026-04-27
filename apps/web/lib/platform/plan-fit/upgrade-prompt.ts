/**
 * Contextual upgrade prompt builder.
 * Step 11: build prompt view model from plan surface + capability.
 */

import type { PlanSurfaceViewModel } from "./plan-surface.types";
import type { UpgradePromptViewModel, CapabilityKeyForPrompt } from "./upgrade-prompt.types";
import { CAPABILITY_PROMPT_CONFIG, UPGRADE_PROMPT_CTA_ROUTE } from "./upgrade-prompt-config";
import { PLAN_DISPLAY_COPY } from "./plan-surface-copy";

const CAPABILITY_KEYS: CapabilityKeyForPrompt[] = [
  "advancedApprovals",
  "advancedDocuments",
  "portfolioAnalytics",
  "managerAi",
  "integrations",
  "sso",
  "auditLogs",
  "apiAccess",
];

function getCapabilityEnabled(surface: PlanSurfaceViewModel, capabilityKey: CapabilityKeyForPrompt): boolean {
  for (const group of surface.capabilityGroups) {
    const item = group.items.find((i) => i.key === capabilityKey);
    if (item) return item.enabled;
  }
  return false;
}

/**
 * Build upgrade prompt for a capability when it's unavailable.
 * Returns null if capability is available or prompt should not be shown.
 */
export function getUpgradePromptForCapability(
  capabilityKey: CapabilityKeyForPrompt,
  surface: PlanSurfaceViewModel | null | undefined
): UpgradePromptViewModel | null {
  if (!surface) return null;
  if (surface.isEnterprise) return null;
  if (getCapabilityEnabled(surface, capabilityKey)) return null;

  const config = CAPABILITY_PROMPT_CONFIG[capabilityKey];
  const requiredPlanCode = config.requiredPlanCode;
  const requiredName = PLAN_DISPLAY_COPY[requiredPlanCode]?.name ?? config.title;
  const targetRoute = UPGRADE_PROMPT_CTA_ROUTE;

  return {
    capabilityKey,
    currentPlanCode: surface.currentPlanCode,
    currentPlanName: surface.humanReadablePlanName,
    requiredPlanCode,
    requiredPlanName: requiredName,
    promptVariant: config.promptVariant,
    title: config.title,
    description: config.description,
    ctaLabel: config.ctaLabel,
    ctaTargetRoute: targetRoute,
    learnMoreLabel: config.learnMoreLabel,
    severity: "info",
    showPrompt: true,
    isLegacyBridge: surface.isLegacyBridge,
  };
}

/**
 * Get all upgrade prompts for disabled capabilities on current plan.
 */
export function getDisabledCapabilityPrompts(
  surface: PlanSurfaceViewModel | null | undefined
): UpgradePromptViewModel[] {
  if (!surface) return [];
  const prompts: UpgradePromptViewModel[] = [];
  for (const key of CAPABILITY_KEYS) {
    const prompt = getUpgradePromptForCapability(key, surface);
    if (prompt) prompts.push(prompt);
  }
  return prompts;
}

/**
 * Get prompt for a specific feature context (e.g. portfolio page).
 * Returns null if capability is available or data is missing.
 */
export function getContextualPlanPrompt(
  capabilityKey: CapabilityKeyForPrompt,
  surface: PlanSurfaceViewModel | null | undefined
): UpgradePromptViewModel | null {
  return getUpgradePromptForCapability(capabilityKey, surface);
}

/** Safe fallback when surface is missing: no prompt, no misleading CTA. */
export function getUpgradePromptFallback(): null {
  return null;
}
