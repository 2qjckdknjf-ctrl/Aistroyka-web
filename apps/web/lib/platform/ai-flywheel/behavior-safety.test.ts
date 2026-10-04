/**
 * Proves production AI routes are not wired to flywheel flags (default-off safety).
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getAiFlywheelFlagSnapshot } from "./flags";

const REPO_ROOT = join(__dirname, "../../../../../");

const PRODUCTION_AI_PATHS = [
  "apps/web/lib/copilot/copilot.service.ts",
  "apps/web/lib/platform/ai/ai.service.ts",
  "apps/web/lib/intelligence/projection.ts",
  "apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.ts",
  "apps/web/app/api/v1/ai/analyze-image/route.ts",
  "apps/web/app/api/v1/projects/[id]/intelligence/route.ts",
];

const ALLOWED_NEW_ROUTES = [
  "apps/web/app/api/v1/tenant/ai-training-consent/route.ts",
];

describe("no user-facing behavior change (flywheel isolation)", () => {
  it("all flywheel flags default false", () => {
    const prev = { ...process.env };
    for (const k of [
      "AI_FLYWHEEL_ENABLED",
      "AI_SHADOW_MODE_ENABLED",
      "AI_DATASET_EXPORT_ENABLED",
    ]) {
      delete process.env[k];
    }
    const snap = getAiFlywheelFlagSnapshot();
    expect(snap.AI_FLYWHEEL_ENABLED).toBe(false);
    expect(snap.AI_SHADOW_MODE_ENABLED).toBe(false);
    expect(snap.AI_DATASET_EXPORT_ENABLED).toBe(false);
    process.env = prev;
  });

  it("production AI hot paths do not import flywheel flags module", () => {
    for (const rel of PRODUCTION_AI_PATHS) {
      const abs = join(REPO_ROOT, rel);
      if (!existsSync(abs)) continue;
      const src = readFileSync(abs, "utf8");
      expect(src.includes("isAiShadowModeEnabled")).toBe(false);
      expect(src.includes("isAiFlywheelEnabled")).toBe(false);
    }
  });

  it("CopilotChatPanel gates optional feedback UI via feedback-ui-gate", () => {
    const abs = join(REPO_ROOT, "apps/web/lib/features/ai/components/CopilotChatPanel.tsx");
    const src = readFileSync(abs, "utf8");
    expect(src.includes("isAiFeedbackCaptureUiEnabled")).toBe(true);
    expect(src.includes("isAiFeedbackCaptureEnabled")).toBe(false);
  });

  it("feedback route passes optional preference pair to submitFeedback only", () => {
    const abs = join(REPO_ROOT, "apps/web/app/api/v1/ai/feedback/route.ts");
    const src = readFileSync(abs, "utf8");
    expect(src.includes("parsePreferencePairFromBody")).toBe(true);
    expect(src.includes("preferencePair")).toBe(true);
    expect(src.includes("isAiFeedbackCaptureEnabled")).toBe(false);
  });

  it("allowed new routes are consent-only", () => {
    for (const rel of ALLOWED_NEW_ROUTES) {
      expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
    }
  });
});
