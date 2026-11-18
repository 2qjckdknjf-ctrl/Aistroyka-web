import { describe, expect, it } from "vitest";
import { shouldShowLoginStepDebug } from "./login-step-debug";

describe("shouldShowLoginStepDebug (PD-P1-01)", () => {
  it("hides debug step in production", () => {
    expect(shouldShowLoginStepDebug("production")).toBe(false);
  });

  it("hides debug step in test", () => {
    expect(shouldShowLoginStepDebug("test")).toBe(false);
  });

  it("allows debug step in development only", () => {
    expect(shouldShowLoginStepDebug("development")).toBe(true);
  });

  it("hides when NODE_ENV is undefined", () => {
    expect(shouldShowLoginStepDebug(undefined)).toBe(false);
  });
});
