import { describe, expect, it } from "vitest";
import {
  buildPromptContextJson,
  deterministicSynthesis,
  selectSynthesisResponse,
} from "./synthesis";

describe("agent synthesis trust boundary", () => {
  it("never produces malformed JSON when structured context exceeds the prompt budget", () => {
    const structuredContext = {
      intent: "project_health",
      tenantBound: true,
      calculate_project_health: { score: 55, band: "RED", reasons: ["Delay"] },
      find_project_blockers: {
        items: Array.from({ length: 100 }, (_, i) => ({
          title: `Blocker ${i}`,
          why: "x".repeat(2_000),
        })),
      },
      get_project_risks: {
        items: Array.from({ length: 100 }, (_, i) => ({
          title: `Risk ${i}`,
          explanation: "y".repeat(2_000),
        })),
      },
    };

    const json = buildPromptContextJson(structuredContext);
    expect(json.length).toBeLessThanOrEqual(12_000);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toMatchObject({
      intent: "project_health",
      tenantBound: true,
      calculate_project_health: { score: 55, band: "RED" },
    });
  });

  it("discards an unvalidated model summary when the provider payload is schema-invalid", () => {
    const contextJson = JSON.stringify({
      calculate_project_health: { score: 55, band: "RED" },
      insufficientEvidence: false,
    });
    const selected = selectSynthesisResponse(
      {
        summary: "Everything is perfect and GREEN",
        health: "not-a-valid-health-object",
      },
      contextJson
    );

    expect(selected.source).toBe("deterministic");
    expect(selected.response.summary).not.toContain("Everything is perfect");
    expect(selected.response.health).toEqual({ score: 55, band: "RED" });
  });

  it("omits failed deterministic health rather than treating it as empty or healthy", () => {
    const response = deterministicSynthesis(
      JSON.stringify({ calculate_project_health: { score: 90, band: "GREEN" } }),
      ["calculate_project_health"]
    );
    expect(response.health).toBeUndefined();
    expect(response.limitations).toContain("AGENT_SKILL_FAILED:calculate_project_health");
    expect(response.confidence).toBe("low");
  });
});
