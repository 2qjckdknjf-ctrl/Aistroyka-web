import { describe, it, expect } from "vitest";
import { getNextActionHref, getNextActionCtaLabel } from "./next-action-href";

const pid = "proj-1";

describe("getNextActionHref", () => {
  it("data quality actions go to uploads tab", () => {
    expect(getNextActionHref(pid, "Improve analysis data quality")).toContain("tab=uploads");
    expect(getNextActionHref(pid, "Continue monitoring progress")).toContain("tab=uploads");
  });

  it("outlier actions go to AI tab", () => {
    expect(getNextActionHref(pid, "Review outlier analysis")).toContain("tab=ai");
  });

  it("default goes to intelligence tab", () => {
    expect(getNextActionHref(pid, "Address critical construction health")).toContain(
      "tab=intelligence"
    );
  });
});

describe("getNextActionCtaLabel", () => {
  it("returns distinct labels per action class", () => {
    expect(getNextActionCtaLabel("Improve analysis data quality")).toBe("Open uploads");
    expect(getNextActionCtaLabel("Address critical construction health")).toBe("Open intelligence");
  });
});
