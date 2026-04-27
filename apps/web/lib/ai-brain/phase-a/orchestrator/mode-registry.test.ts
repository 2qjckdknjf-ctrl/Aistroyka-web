/**
 * AI Brain Phase A — Mode registry tests.
 */

import { describe, it, expect } from "vitest";
import { getModeDefinition, MODE_REGISTRY } from "./mode-registry";

describe("mode-registry", () => {
  it("defines all five modes", () => {
    expect(Object.keys(MODE_REGISTRY)).toHaveLength(5);
    expect(MODE_REGISTRY.executive_summary).toBeDefined();
    expect(MODE_REGISTRY.project_intelligence).toBeDefined();
    expect(MODE_REGISTRY.manager_assist).toBeDefined();
    expect(MODE_REGISTRY.worker_assist).toBeDefined();
    expect(MODE_REGISTRY.client_safe_summary).toBeDefined();
  });

  it("getModeDefinition returns correct definition for executive_summary", () => {
    const def = getModeDefinition("executive_summary");
    expect(def.mode).toBe("executive_summary");
    expect(def.outputContract).toBe("ExecutiveProjectBrief");
    expect(def.requiredContext).toContain("snapshot");
    expect(def.allowedTools).toContain("get_project_truth_snapshot");
  });

  it("client_safe_summary has restricted tools", () => {
    const def = getModeDefinition("client_safe_summary");
    expect(def.allowedTools).not.toContain("get_top_risks_summary");
    expect(def.allowedTools).toContain("get_project_health_summary");
  });
});
