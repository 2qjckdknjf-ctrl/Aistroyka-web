import { describe, expect, it } from "vitest";
import { resolveHorizontalTabKeyboardIndex } from "./tabs-keyboard";

describe("resolveHorizontalTabKeyboardIndex", () => {
  it("moves right with wrap from last to first", () => {
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "ArrowRight", currentIndex: 0, tabCount: 3 })
    ).toBe(1);
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "ArrowRight", currentIndex: 2, tabCount: 3 })
    ).toBe(0);
  });

  it("moves left with wrap from first to last", () => {
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "ArrowLeft", currentIndex: 0, tabCount: 3 })
    ).toBe(2);
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "ArrowLeft", currentIndex: 2, tabCount: 3 })
    ).toBe(1);
  });

  it("handles Home and End", () => {
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "Home", currentIndex: 2, tabCount: 5 })
    ).toBe(0);
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "End", currentIndex: 0, tabCount: 5 })
    ).toBe(4);
  });

  it("ignores unrelated keys", () => {
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "Enter", currentIndex: 1, tabCount: 3 })
    ).toBeNull();
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "Tab", currentIndex: 1, tabCount: 3 })
    ).toBeNull();
    expect(
      resolveHorizontalTabKeyboardIndex({ key: "ArrowDown", currentIndex: 1, tabCount: 3 })
    ).toBeNull();
  });
});
