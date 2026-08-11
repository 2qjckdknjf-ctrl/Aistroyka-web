/**
 * AI Flywheel feature flags — all risky flags default OFF.
 * See docs/ai-flywheel/AI_FLYWHEEL_FLAGS.md
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getAiFlywheelFlagSnapshot,
  isAiFlywheelEnabled,
  isAiShadowModeEnabled,
  isAiDatasetExportEnabled,
  isAiFeedbackCaptureEnabled,
} from "./flags";

describe("ai-flywheel flags", () => {
  const originalEnv = { ...process.env };
  const FLAG_KEYS = [
    "AI_FLYWHEEL_ENABLED",
    "AI_TRAINING_CONSENT_UI_ENABLED",
    "AI_FEEDBACK_CAPTURE_ENABLED",
    "AI_EXPERT_REVIEW_ENABLED",
    "AI_DATASET_EXPORT_ENABLED",
    "AI_SHADOW_MODE_ENABLED",
    "AI_GOLD_MEMORY_ENABLED",
  ];

  beforeEach(() => {
    for (const k of FLAG_KEYS) delete process.env[k];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("all flags default false when unset", () => {
    const snap = getAiFlywheelFlagSnapshot();
    expect(snap.AI_FLYWHEEL_ENABLED).toBe(false);
    expect(snap.AI_SHADOW_MODE_ENABLED).toBe(false);
    expect(snap.AI_DATASET_EXPORT_ENABLED).toBe(false);
    expect(snap.AI_FEEDBACK_CAPTURE_ENABLED).toBe(false);
    expect(snap.AI_TRAINING_CONSENT_UI_ENABLED).toBe(false);
    expect(snap.AI_EXPERT_REVIEW_ENABLED).toBe(false);
    expect(snap.AI_GOLD_MEMORY_ENABLED).toBe(false);
  });

  it("sub-flags require AI_FLYWHEEL_ENABLED master gate", () => {
    process.env.AI_SHADOW_MODE_ENABLED = "true";
    expect(isAiShadowModeEnabled()).toBe(false);
    process.env.AI_FLYWHEEL_ENABLED = "true";
    expect(isAiShadowModeEnabled()).toBe(true);
  });

  it("dataset export and feedback require master gate", () => {
    process.env.AI_DATASET_EXPORT_ENABLED = "true";
    process.env.AI_FEEDBACK_CAPTURE_ENABLED = "true";
    expect(isAiDatasetExportEnabled()).toBe(false);
    expect(isAiFeedbackCaptureEnabled()).toBe(false);
    process.env.AI_FLYWHEEL_ENABLED = "true";
    expect(isAiDatasetExportEnabled()).toBe(true);
    expect(isAiFeedbackCaptureEnabled()).toBe(true);
  });

  it("master flag alone does not enable risky sub-flags", () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    expect(isAiFlywheelEnabled()).toBe(true);
    expect(isAiShadowModeEnabled()).toBe(false);
    expect(isAiDatasetExportEnabled()).toBe(false);
  });
});
