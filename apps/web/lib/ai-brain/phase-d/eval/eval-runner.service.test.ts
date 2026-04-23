/**
 * AI Brain Phase D — Eval runner tests.
 */

import { describe, it, expect } from "vitest";
import { runEvalSuite } from "./eval-runner.service";

describe("runEvalSuite", () => {
  it("returns summary with fixture outputs when useFixtures true", async () => {
    const summary = await runEvalSuite(null, { useFixtures: true });
    expect(summary.evalRunId).toMatch(/^eval_/);
    expect(summary.totalCases).toBeGreaterThan(0);
    expect(summary.results).toHaveLength(summary.totalCases);
    expect(summary.passed + summary.failed + summary.partial + summary.skipped).toBe(
      summary.totalCases
    );
  });

  it("skips cases when no outputs and useFixtures false", async () => {
    const summary = await runEvalSuite(null, { useFixtures: false });
    expect(summary.totalCases).toBeGreaterThan(0);
    expect(summary.skipped).toBe(summary.totalCases);
  });

  it("filters by mode when provided", async () => {
    const summary = await runEvalSuite(null, {
      useFixtures: true,
      mode: "executive_summary",
    });
    expect(summary.totalCases).toBeGreaterThan(0);
    for (const r of summary.results) {
      expect(r.caseTitle).toBeDefined();
    }
  });
});
