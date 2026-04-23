/**
 * Pure presentation helpers for upgrade prompt UI.
 * Step 11 closure: testable logic for FeatureUpgradePromptCard, CapabilityGate, etc.
 */

import type { PlanSurfaceViewModel } from "./plan-surface.types";
import type { UpgradePromptViewModel, CapabilityKeyForPrompt } from "./upgrade-prompt.types";
import { getContextualPlanPrompt, getDisabledCapabilityPrompts } from "./upgrade-prompt";
import { UPGRADE_PROMPT_CTA_ROUTE } from "./upgrade-prompt-config";

export interface FeatureUpgradePromptDisplayProps {
  title: string;
  description: string;
  ctaLabel: string;
  ctaTargetRoute: string;
}

/** Extract display props for FeatureUpgradePromptCard. CTA route is always safe internal. */
export function getFeatureUpgradePromptDisplayProps(prompt: UpgradePromptViewModel): FeatureUpgradePromptDisplayProps {
  return {
    title: prompt.title,
    description: prompt.description,
    ctaLabel: prompt.ctaLabel,
    ctaTargetRoute: prompt.ctaTargetRoute,
  };
}

/** Assert CTA route is safe (no checkout/provider). */
export function isSafeCtaRoute(route: string): boolean {
  if (!route.startsWith("/")) return false;
  if (/checkout|stripe|paddle|revenuecat|pay|purchase/i.test(route)) return false;
  return true;
}

export type CapabilityGateRenderMode = "skeleton" | "prompt" | "children";

/**
 * Determine CapabilityGate render mode.
 * Graceful degradation: when surface is null/undefined, render children (no blocking).
 */
export function getCapabilityGateRenderMode(
  surface: PlanSurfaceViewModel | null | undefined,
  capabilityKey: CapabilityKeyForPrompt,
  isLoading: boolean,
  blockWhileLoading: boolean
): CapabilityGateRenderMode {
  if (isLoading && blockWhileLoading) return "skeleton";
  const prompt = getContextualPlanPrompt(capabilityKey, surface);
  if (prompt) return "prompt";
  return "children";
}

/** Whether InlineUpgradeHint should render. */
export function shouldShowInlineUpgradeHint(
  surface: PlanSurfaceViewModel | null | undefined,
  capabilityKey: CapabilityKeyForPrompt
): boolean {
  return getContextualPlanPrompt(capabilityKey, surface) !== null;
}

export interface AvailableWithHigherPlansItem {
  capabilityKey: CapabilityKeyForPrompt;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTargetRoute: string;
}

/**
 * Items for AvailableWithHigherPlans section.
 * Empty for enterprise or when surface missing. All CTA routes are safe.
 */
export function getAvailableWithHigherPlansItems(
  surface: PlanSurfaceViewModel | null | undefined
): AvailableWithHigherPlansItem[] {
  const prompts = getDisabledCapabilityPrompts(surface);
  return prompts.map((p) => ({
    capabilityKey: p.capabilityKey,
    title: p.title,
    description: p.description,
    ctaLabel: p.ctaLabel,
    ctaTargetRoute: p.ctaTargetRoute,
  }));
}

/** Validate all display items have safe CTA. */
export function allCtaRoutesSafe(items: AvailableWithHigherPlansItem[]): boolean {
  return items.every((i) => i.ctaTargetRoute === UPGRADE_PROMPT_CTA_ROUTE && isSafeCtaRoute(i.ctaTargetRoute));
}
