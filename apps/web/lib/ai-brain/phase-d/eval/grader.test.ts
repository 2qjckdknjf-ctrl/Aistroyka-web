/**
 * AI Brain Phase D — Grader tests.
 */

import { describe, it, expect } from "vitest";
import { gradeOutput } from "./grader";
import type { AiEvalCase } from "./eval-case.types";

describe("gradeOutput", () => {
  it("returns pass when all schema assertions pass", () => {
    const caseDef: AiEvalCase = {
      id: "1",
      title: "Schema test",
      scenarioType: "brief",
      mode: "executive_summary",
      requiredInputs: {},
      expectedAssertions: [
        { type: "schema", path: "summary" },
        { type: "contains", path: "summary.overview" },
      ],
      gradingStrategy: "strict",
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    const output = { summary: { overview: "ok" } };
    const r = gradeOutput(caseDef, output);
    expect(r.result).toBe("pass");
    expect(r.warnings).toHaveLength(0);
  });

  it("returns fail when path missing", () => {
    const caseDef: AiEvalCase = {
      id: "1",
      title: "Schema test",
      scenarioType: "brief",
      mode: "executive_summary",
      requiredInputs: {},
      expectedAssertions: [{ type: "schema", path: "summary" }],
      gradingStrategy: "strict",
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    const output = {};
    const r = gradeOutput(caseDef, output);
    expect(r.result).toBe("fail");
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("returns partial when no assertions defined", () => {
    const caseDef: AiEvalCase = {
      id: "1",
      title: "Empty",
      scenarioType: "brief",
      mode: "executive_summary",
      requiredInputs: {},
      expectedAssertions: [],
      gradingStrategy: "strict",
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    const r = gradeOutput(caseDef, {});
    expect(r.result).toBe("partial");
    expect(r.warnings).toContain("No assertions defined");
  });

  it("checks refusal assertion", () => {
    const caseDef: AiEvalCase = {
      id: "1",
      title: "Refusal",
      scenarioType: "brief",
      mode: "client_safe_summary",
      requiredInputs: {},
      expectedAssertions: [{ type: "refusal", value: true }],
      gradingStrategy: "strict",
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    const r1 = gradeOutput(caseDef, { withheld: true });
    expect(r1.result).toBe("pass");
    const r2 = gradeOutput(caseDef, {});
    expect(r2.result).toBe("fail");
  });

  it("checks degradation assertion", () => {
    const caseDef: AiEvalCase = {
      id: "1",
      title: "Degradation",
      scenarioType: "brief",
      mode: "executive_summary",
      requiredInputs: {},
      expectedAssertions: [{ type: "degradation", value: true }],
      gradingStrategy: "strict",
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    const r1 = gradeOutput(caseDef, { degradationFlags: ["partial"] });
    expect(r1.result).toBe("pass");
    const r2 = gradeOutput(caseDef, {});
    expect(r2.result).toBe("fail");
  });
});
