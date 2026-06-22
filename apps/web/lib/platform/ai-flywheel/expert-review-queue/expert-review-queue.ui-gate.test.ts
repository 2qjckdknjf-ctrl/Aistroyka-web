import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { isExpertReviewQueueUiEnabled } from "./expert-review-queue.ui-gate";

describe("expert-review-queue ui gate", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_EXPERT_REVIEW_QUEUE_ENABLED;
    delete process.env.AI_EXPERT_REVIEW_ADMIN_UI_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("false when flags unset", () => {
    expect(isExpertReviewQueueUiEnabled()).toBe(false);
  });

  it("true when master + admin UI enabled", () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_EXPERT_REVIEW_QUEUE_ENABLED = "true";
    process.env.AI_EXPERT_REVIEW_ADMIN_UI_ENABLED = "true";
    expect(isExpertReviewQueueUiEnabled()).toBe(true);
  });
});
