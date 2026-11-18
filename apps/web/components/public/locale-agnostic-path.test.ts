import { describe, expect, it } from "vitest";
import { localeAgnosticPath } from "./locale-agnostic-path";

describe("localeAgnosticPath", () => {
  it("keeps already-stripped paths", () => {
    expect(localeAgnosticPath("/pricing")).toBe("/pricing");
    expect(localeAgnosticPath("/")).toBe("/");
  });

  it("strips a locale prefix so Link does not double-prefix", () => {
    expect(localeAgnosticPath("/en/pricing")).toBe("/pricing");
    expect(localeAgnosticPath("/ru")).toBe("/");
    expect(localeAgnosticPath("/es/features/ai")).toBe("/features/ai");
    expect(localeAgnosticPath("/it")).toBe("/");
  });

  it("does not strip locale-like segments that are not the first prefix", () => {
    expect(localeAgnosticPath("/docs/en")).toBe("/docs/en");
  });
});
