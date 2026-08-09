import { describe, expect, it } from "vitest";
import { getNextFocusIndex } from "./modal-focus";

describe("getNextFocusIndex (PD-P1-03 focus trap)", () => {
  it("wraps forward from last to first", () => {
    expect(getNextFocusIndex(2, 3, false)).toBe(0);
  });

  it("advances forward within range", () => {
    expect(getNextFocusIndex(0, 3, false)).toBe(1);
  });

  it("wraps backward from first to last", () => {
    expect(getNextFocusIndex(0, 3, true)).toBe(2);
  });

  it("moves backward within range", () => {
    expect(getNextFocusIndex(2, 3, true)).toBe(1);
  });

  it("returns -1 for empty set", () => {
    expect(getNextFocusIndex(0, 0, false)).toBe(-1);
  });
});
