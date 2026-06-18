import { describe, expect, it, vi } from "vitest";
import {
  clampLiquidGlassIntensity,
  liquidGlassClassNames,
  LG_INTENSITY_DEFAULT,
  LG_INTENSITY_MAX,
  LG_INTENSITY_MIN,
  warnIfGlassBudgetExceeded,
} from "./liquid-glass";

describe("liquid-glass design tokens", () => {
  it("builds canonical class names", () => {
    expect(
      liquidGlassClassNames({
        intensity: "strong",
        variant: "nav",
        pill: true,
        motion: ["interactive", "glow"],
        className: "custom",
      }),
    ).toBe("lg lg--intensity-strong lg--variant-nav lg--pill lg--interactive lg--glow custom");
  });

  it("clamps intensity", () => {
    expect(clampLiquidGlassIntensity(10)).toBe(LG_INTENSITY_MIN);
    expect(clampLiquidGlassIntensity(999)).toBe(LG_INTENSITY_MAX);
    expect(clampLiquidGlassIntensity(55.4)).toBe(LG_INTENSITY_DEFAULT);
  });

  it("warns in dev when glass budget exceeded", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfGlassBudgetExceeded(7);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does not warn in production", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfGlassBudgetExceeded(99);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    process.env.NODE_ENV = prev;
  });
});
