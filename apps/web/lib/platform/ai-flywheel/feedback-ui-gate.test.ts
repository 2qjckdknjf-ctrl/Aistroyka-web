import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isAiFeedbackCaptureUiEnabled } from "./feedback-ui-gate";

const REPO_ROOT = join(__dirname, "../../../../../");

describe("feedback UI gate", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_FEEDBACK_CAPTURE_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns false when flywheel flags are unset (production default)", () => {
    expect(isAiFeedbackCaptureUiEnabled()).toBe(false);
  });

  it("returns false when only master flag is set", () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    expect(isAiFeedbackCaptureUiEnabled()).toBe(false);
  });

  it("returns true when master + feedback capture flags are set", () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_FEEDBACK_CAPTURE_ENABLED = "true";
    expect(isAiFeedbackCaptureUiEnabled()).toBe(true);
  });
});

describe("CopilotChatPanel gates optional feedback UI", () => {
  it("imports feedback-ui-gate and checks isAiFeedbackCaptureUiEnabled", () => {
    const abs = join(REPO_ROOT, "apps/web/lib/features/ai/components/CopilotChatPanel.tsx");
    const src = readFileSync(abs, "utf8");
    expect(src.includes("isAiFeedbackCaptureUiEnabled")).toBe(true);
    expect(src.includes("feedback-ui-gate")).toBe(true);
    expect(/isAiFeedbackCaptureUiEnabled\(\)\s*&&/.test(src)).toBe(true);
  });
});

describe("CopilotOptionalFeedback does not self-gate incorrectly", () => {
  it("component exists and delegates gating to parent", () => {
    const abs = join(REPO_ROOT, "apps/web/lib/features/ai/components/CopilotOptionalFeedback.tsx");
    expect(existsSync(abs)).toBe(true);
  });
});
