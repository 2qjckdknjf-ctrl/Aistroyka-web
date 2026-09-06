/**
 * AI Flywheel feature flags. All risky flags default OFF.
 * Pattern mirrors billing-provider-config.ts — env booleans, no DB rollout in foundation sprint.
 */

export const AI_FLYWHEEL_FLAG_NAMES = [
  "AI_FLYWHEEL_ENABLED",
  "AI_TRAINING_CONSENT_UI_ENABLED",
  "AI_FEEDBACK_CAPTURE_ENABLED",
  "AI_EXPERT_REVIEW_ENABLED",
  "AI_DATASET_EXPORT_ENABLED",
  "AI_SHADOW_MODE_ENABLED",
  "AI_GOLD_MEMORY_ENABLED",
] as const;

export type AiFlywheelFlagName = (typeof AI_FLYWHEEL_FLAG_NAMES)[number];

function getEnv(name: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function isTruthyEnv(name: string): boolean {
  const v = getEnv(name).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Master gate — other flywheel features should check this first. Default false. */
export function isAiFlywheelEnabled(): boolean {
  return isTruthyEnv("AI_FLYWHEEL_ENABLED");
}

export function isAiTrainingConsentUiEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_TRAINING_CONSENT_UI_ENABLED");
}

export function isAiFeedbackCaptureEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_FEEDBACK_CAPTURE_ENABLED");
}

export function isAiExpertReviewEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_EXPERT_REVIEW_ENABLED");
}

export function isAiDatasetExportEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_DATASET_EXPORT_ENABLED");
}

/** Must remain disabled in foundation sprint. Default false. */
export function isAiShadowModeEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_SHADOW_MODE_ENABLED");
}

export function isAiGoldMemoryEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_GOLD_MEMORY_ENABLED");
}

export interface AiFlywheelFlagSnapshot {
  AI_FLYWHEEL_ENABLED: boolean;
  AI_TRAINING_CONSENT_UI_ENABLED: boolean;
  AI_FEEDBACK_CAPTURE_ENABLED: boolean;
  AI_EXPERT_REVIEW_ENABLED: boolean;
  AI_DATASET_EXPORT_ENABLED: boolean;
  AI_SHADOW_MODE_ENABLED: boolean;
  AI_GOLD_MEMORY_ENABLED: boolean;
}

/** Snapshot for diagnostics and tests. */
export function getAiFlywheelFlagSnapshot(): AiFlywheelFlagSnapshot {
  return {
    AI_FLYWHEEL_ENABLED: isAiFlywheelEnabled(),
    AI_TRAINING_CONSENT_UI_ENABLED: isAiTrainingConsentUiEnabled(),
    AI_FEEDBACK_CAPTURE_ENABLED: isAiFeedbackCaptureEnabled(),
    AI_EXPERT_REVIEW_ENABLED: isAiExpertReviewEnabled(),
    AI_DATASET_EXPORT_ENABLED: isAiDatasetExportEnabled(),
    AI_SHADOW_MODE_ENABLED: isAiShadowModeEnabled(),
    AI_GOLD_MEMORY_ENABLED: isAiGoldMemoryEnabled(),
  };
}
