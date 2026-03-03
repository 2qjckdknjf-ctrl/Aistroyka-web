import { describe, expect, it } from "vitest";
import {
  ALLOWED_STAGES_LIST,
  ALLOWED_STAGES_PROMPT_STRING,
  ALLOWED_STAGES_SET,
} from "./stages";

describe("stages", () => {
  it("ALLOWED_STAGES_LIST has expected stages including unknown", () => {
    expect(ALLOWED_STAGES_LIST).toContain("unknown");
    expect(ALLOWED_STAGES_LIST).toContain("foundation");
    expect(ALLOWED_STAGES_LIST).toContain("MEP");
    expect(ALLOWED_STAGES_LIST.length).toBeGreaterThanOrEqual(8);
  });

  it("ALLOWED_STAGES_SET contains lowercase versions of all list items", () => {
    expect(ALLOWED_STAGES_SET.size).toBe(ALLOWED_STAGES_LIST.length);
    for (const stage of ALLOWED_STAGES_LIST) {
      expect(ALLOWED_STAGES_SET.has(stage.toLowerCase())).toBe(true);
    }
  });

  it("ALLOWED_STAGES_PROMPT_STRING contains each stage in quotes", () => {
    for (const stage of ALLOWED_STAGES_LIST) {
      expect(ALLOWED_STAGES_PROMPT_STRING).toContain(`"${stage}"`);
    }
  });
});
