/**
 * AI Brain Phase D — Version refs tests.
 */

import { describe, it, expect } from "vitest";
import { captureVersionRefs } from "./version-refs";

describe("captureVersionRefs", () => {
  it("returns array of layer refs", () => {
    const refs = captureVersionRefs();
    expect(Array.isArray(refs)).toBe(true);
    expect(refs.length).toBeGreaterThan(0);
  });

  it("each ref has layer and version", () => {
    const refs = captureVersionRefs();
    for (const r of refs) {
      expect(typeof r.layer).toBe("string");
      expect(typeof r.version).toBe("string");
      expect(r.layer.length).toBeGreaterThan(0);
      expect(r.version.length).toBeGreaterThan(0);
    }
  });

  it("includes expected layers", () => {
    const refs = captureVersionRefs();
    const layers = refs.map((r) => r.layer);
    expect(layers).toContain("prompt");
    expect(layers).toContain("policy");
    expect(layers).toContain("planner");
    expect(layers).toContain("output_contract");
    expect(layers).toContain("memory_retrieval");
  });
});
