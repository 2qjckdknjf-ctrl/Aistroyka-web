import { describe, expect, it } from "vitest";
import { isIgnorablePhase3dConsoleError } from "./phase3d-console-guard";

describe("isIgnorablePhase3dConsoleError", () => {
  it("ignores expected fail-closed resource status noise", () => {
    expect(
      isIgnorablePhase3dConsoleError(
        "Failed to load resource: the server responded with a status of 403 (Forbidden)"
      )
    ).toBe(true);
    expect(
      isIgnorablePhase3dConsoleError(
        "Failed to load resource: the server responded with a status of 503 (Service Unavailable)"
      )
    ).toBe(true);
    expect(
      isIgnorablePhase3dConsoleError(
        "Failed to load resource: the server responded with a status of 404 (Not Found)"
      )
    ).toBe(true);
  });

  it("does not ignore unexpected application console errors", () => {
    expect(isIgnorablePhase3dConsoleError("Uncaught TypeError: x is not a function")).toBe(false);
    expect(
      isIgnorablePhase3dConsoleError(
        "Failed to load resource: the server responded with a status of 500 (Internal Server Error)"
      )
    ).toBe(false);
  });
});
