import { describe, it, expect } from "vitest";
import { parseCostVisionOutput } from "./estimate-cost.service";

describe("parseCostVisionOutput", () => {
  it("parses valid cost vision JSON", () => {
    const content = JSON.stringify({
      work_categories: ["finishing", "MEP"],
      rough_range_min: 100000,
      rough_range_max: 200000,
      currency_hint: "RUB",
      confidence: "medium",
      missing_data_reasons: ["Image shows partial view"],
      assumption_notes: "Based on visible area only",
    });
    const out = parseCostVisionOutput(content);
    expect(out.work_categories).toEqual(["finishing", "MEP"]);
    expect(out.rough_range_min).toBe(100000);
    expect(out.rough_range_max).toBe(200000);
    expect(out.currency_hint).toBe("RUB");
    expect(out.confidence).toBe("medium");
    expect(out.missing_data_reasons).toEqual(["Image shows partial view"]);
    expect(out.assumption_notes).toBe("Based on visible area only");
  });

  it("defaults confidence to low when invalid", () => {
    const content = JSON.stringify({
      work_categories: [],
      rough_range_min: null,
      rough_range_max: null,
      currency_hint: null,
      confidence: "invalid",
      missing_data_reasons: [],
      assumption_notes: null,
    });
    const out = parseCostVisionOutput(content);
    expect(out.confidence).toBe("low");
  });

  it("handles null ranges and empty arrays", () => {
    const content = JSON.stringify({
      work_categories: [],
      rough_range_min: null,
      rough_range_max: null,
      currency_hint: null,
      confidence: "high",
      missing_data_reasons: [],
      assumption_notes: null,
    });
    const out = parseCostVisionOutput(content);
    expect(out.rough_range_min).toBeNull();
    expect(out.rough_range_max).toBeNull();
    expect(out.work_categories).toEqual([]);
    expect(out.missing_data_reasons).toEqual([]);
    expect(out.assumption_notes).toBeNull();
  });
});
