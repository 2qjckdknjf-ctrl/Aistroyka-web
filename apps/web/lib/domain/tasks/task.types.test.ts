import { describe, expect, it } from "vitest";
import { parseTaskPriority } from "./task.types";

describe("parseTaskPriority", () => {
  it("accepts low/medium/high case-insensitively", () => {
    expect(parseTaskPriority("low")).toBe("low");
    expect(parseTaskPriority("MEDIUM")).toBe("medium");
    expect(parseTaskPriority(" High ")).toBe("high");
  });

  it("rejects unknown values", () => {
    expect(parseTaskPriority("urgent")).toBeUndefined();
    expect(parseTaskPriority(1)).toBeUndefined();
    expect(parseTaskPriority(null)).toBeUndefined();
  });
});
