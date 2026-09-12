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

  it("keeps health, risks and blockers authoritative even for schema-valid provider JSON", () => {
    const contextJson = JSON.stringify({
      calculate_project_health: { score: 55, band: "RED" },
      get_project_risks: {
        items: [{ title: "Verified delay", severity: "high", explanation: "Task evidence" }],
      },
      find_project_blockers: {
        items: [{ title: "Verified blocker", why: "Blocking defect" }],
      },
      insufficientEvidence: false,
    });

    const selected = selectSynthesisResponse(
      {
        summary: "Manager-facing summary",
        health: { score: 99, band: "GREEN" },
        risks: [{ title: "Invented risk", severity: "low", why: "model only" }],
        blockers: [{ title: "Invented blocker", why: "model only" }],
        observations: ["Invented observation"],
        proposedActions: [],
        limitations: [],
        confidence: "high",
      },
      contextJson
    );

    expect(selected.source).toBe("llm");
    expect(selected.response.summary).toBe("Manager-facing summary");
    expect(selected.response.health).toEqual({ score: 55, band: "RED" });
    expect(selected.response.risks).toEqual([
      { title: "Verified delay", severity: "high", why: "Task evidence" },
    ]);
    expect(selected.response.blockers).toEqual([
      { title: "Verified blocker", why: "Blocking defect" },
    ]);
    expect(selected.response.observations).toEqual([]);
  });

  it("localizes deterministic fallback prose while keeping stable limitation codes", () => {
    const context = JSON.stringify({ insufficientEvidence: false });
    expect(deterministicSynthesis(context, [], "ru").summary).toContain("Сигналы проекта");
    expect(deterministicSynthesis(context, [], "es").summary).toContain("señales del proyecto");
    expect(deterministicSynthesis(context, [], "it").summary).toContain("segnali del progetto");

    const insufficient = deterministicSynthesis(
      JSON.stringify({ insufficientEvidence: true }),
      ["get_project_state"],
      "ru-RU"
    );
    expect(insufficient.summary).toContain("Недостаточно проверенных данных");
    expect(insufficient.limitations).toContain("INSUFFICIENT_EVIDENCE");
    expect(insufficient.limitations).toContain("AGENT_SKILL_FAILED:get_project_state");
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
