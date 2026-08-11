/**
 * Expert Review Queue feature flags — all default OFF.
 */

import { isAiFlywheelEnabled } from "../flags";

function getEnv(name: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function isTruthyEnv(name: string): boolean {
  const v = getEnv(name).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function masterQueueEnabled(): boolean {
  return isAiFlywheelEnabled() && isTruthyEnv("AI_EXPERT_REVIEW_QUEUE_ENABLED");
}

export function isExpertReviewQueueEnabled(): boolean {
  return masterQueueEnabled();
}

export function isExpertReviewWriteEnabled(): boolean {
  return masterQueueEnabled() && isTruthyEnv("AI_EXPERT_REVIEW_WRITE_ENABLED");
}

export function isExpertReviewAdminUiEnabled(): boolean {
  return masterQueueEnabled() && isTruthyEnv("AI_EXPERT_REVIEW_ADMIN_UI_ENABLED");
}

export function isExpertReviewGoldMemoryBridgeEnabled(): boolean {
  return (
    masterQueueEnabled() &&
    isTruthyEnv("AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED")
  );
}

export function getExpertReviewQueueFlagSnapshot() {
  return {
    AI_EXPERT_REVIEW_QUEUE_ENABLED: masterQueueEnabled(),
    AI_EXPERT_REVIEW_WRITE_ENABLED: isExpertReviewWriteEnabled(),
    AI_EXPERT_REVIEW_ADMIN_UI_ENABLED: isExpertReviewAdminUiEnabled(),
    AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED: isExpertReviewGoldMemoryBridgeEnabled(),
  };
}
