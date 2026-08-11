import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getExpertReviewQueueFlagSnapshot,
  isExpertReviewAdminUiEnabled,
  isExpertReviewWriteEnabled,
} from "./expert-review-queue.flags";

describe("expert-review-queue flags", () => {
  const originalEnv = { ...process.env };
  const KEYS = [
    "AI_FLYWHEEL_ENABLED",
    "AI_EXPERT_REVIEW_QUEUE_ENABLED",
    "AI_EXPERT_REVIEW_WRITE_ENABLED",
    "AI_EXPERT_REVIEW_ADMIN_UI_ENABLED",
    "AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED",
  ];

  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("all flags default false", () => {
    const snap = getExpertReviewQueueFlagSnapshot();
    expect(snap.AI_EXPERT_REVIEW_QUEUE_ENABLED).toBe(false);
    expect(snap.AI_EXPERT_REVIEW_WRITE_ENABLED).toBe(false);
    expect(snap.AI_EXPERT_REVIEW_ADMIN_UI_ENABLED).toBe(false);
    expect(snap.AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED).toBe(false);
  });

  it("sub-flags require master queue gate", () => {
    process.env.AI_EXPERT_REVIEW_WRITE_ENABLED = "true";
    process.env.AI_EXPERT_REVIEW_ADMIN_UI_ENABLED = "true";
    expect(isExpertReviewWriteEnabled()).toBe(false);
    expect(isExpertReviewAdminUiEnabled()).toBe(false);
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_EXPERT_REVIEW_QUEUE_ENABLED = "true";
    expect(isExpertReviewWriteEnabled()).toBe(true);
    expect(isExpertReviewAdminUiEnabled()).toBe(true);
  });
});
