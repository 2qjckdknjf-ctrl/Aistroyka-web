import { describe, expect, it } from "vitest";
import { resolveLaunchBannerDensity } from "./launch-banner-density";

describe("resolveLaunchBannerDensity", () => {
  it("hides when activation is complete", () => {
    expect(
      resolveLaunchBannerDensity({ completed: 5, total: 5, userExpanded: false })
    ).toBe("hidden");
  });

  it("keeps first-run guidance expanded at 0 completed", () => {
    expect(
      resolveLaunchBannerDensity({ completed: 0, total: 5, userExpanded: false })
    ).toBe("expanded");
  });

  it("defaults returning partial progress to compact", () => {
    expect(
      resolveLaunchBannerDensity({ completed: 2, total: 5, userExpanded: false })
    ).toBe("compact");
  });

  it("expands returning guidance when the user requests it", () => {
    expect(
      resolveLaunchBannerDensity({ completed: 2, total: 5, userExpanded: true })
    ).toBe("expanded");
  });
});
