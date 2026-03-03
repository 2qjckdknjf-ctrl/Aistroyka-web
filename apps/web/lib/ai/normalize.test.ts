import { describe, expect, it } from "vitest";
import {
  normalizeStage,
  parseJsonFromContent,
  sanitizeAnalysisResult,
} from "./normalize";

describe("normalizeStage", () => {
  it("returns known stage as lowercase", () => {
    expect(normalizeStage("foundation")).toBe("foundation");
    expect(normalizeStage("Framing")).toBe("framing");
    expect(normalizeStage("MEP")).toBe("mep");
    expect(normalizeStage("complete")).toBe("complete");
  });

  it("returns unknown for invalid or empty", () => {
    expect(normalizeStage("")).toBe("unknown");
    expect(normalizeStage(undefined)).toBe("unknown");
    expect(normalizeStage("  ")).toBe("unknown");
    expect(normalizeStage("roofing")).toBe("unknown");
    expect(normalizeStage("foundation phase")).toBe("unknown");
  });

  it("trims and lowercases before check", () => {
    expect(normalizeStage("  foundation  ")).toBe("foundation");
    expect(normalizeStage("PRE-CONSTRUCTION")).toBe("pre-construction");
  });
});

describe("parseJsonFromContent", () => {
  it("parses plain JSON", () => {
    const o = { stage: "framing", completion_percent: 50 };
    expect(parseJsonFromContent(JSON.stringify(o))).toEqual(o);
  });

  it("parses JSON wrapped in ```json ... ```", () => {
    const o = { stage: "foundation" };
    const wrapped = "```json\n" + JSON.stringify(o) + "\n```";
    expect(parseJsonFromContent(wrapped)).toEqual(o);
  });

  it("parses JSON with leading/trailing text by taking first { to last }", () => {
    const o = { a: 1 };
    const text = "Here is the result:\n" + JSON.stringify(o) + "\nEnd.";
    expect(parseJsonFromContent(text)).toEqual(o);
  });

  it("parses JSON with trailing comma (LLM quirk)", () => {
    const bad = '{"stage": "foundation", "completion_percent": 50,}';
    expect(parseJsonFromContent(bad)).toEqual({
      stage: "foundation",
      completion_percent: 50,
    });
  });

  it("throws on non-JSON content", () => {
    expect(() => parseJsonFromContent("not json")).toThrow("non-JSON");
    expect(() => parseJsonFromContent("")).toThrow();
  });
});

describe("sanitizeAnalysisResult", () => {
  const base = {
    stage: "framing",
    completion_percent: 50,
    risk_level: "medium" as const,
    detected_issues: [] as string[],
    recommendations: [] as string[],
  };

  it("trims and dedupes issues and recommendations", () => {
    const result = sanitizeAnalysisResult({
      ...base,
      detected_issues: ["  rebar exposed  ", "rebar exposed", "weather delay"],
      recommendations: ["fix rebar", "fix rebar"],
    });
    expect(result.detected_issues).toEqual(["rebar exposed", "weather delay"]);
    expect(result.recommendations).toEqual(["fix rebar"]);
  });

  it("caps string length and array size", () => {
    const long = "x".repeat(600);
    const many = Array.from({ length: 40 }, (_, i) => `issue ${i}`);
    const result = sanitizeAnalysisResult({
      ...base,
      detected_issues: [long, ...many],
      recommendations: [],
    });
    expect(result.detected_issues[0].length).toBe(500);
    expect(result.detected_issues.length).toBe(30);
  });

  it("preserves stage, completion_percent, risk_level", () => {
    const result = sanitizeAnalysisResult(base);
    expect(result.stage).toBe("framing");
    expect(result.completion_percent).toBe(50);
    expect(result.risk_level).toBe("medium");
  });
});
