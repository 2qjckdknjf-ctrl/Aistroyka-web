import { describe, expect, it, vi } from "vitest";
import { isDiagEnabled } from "./diag";

describe("isDiagEnabled", () => {
  it("returns true when NODE_ENV is not production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    expect(isDiagEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "test");
    expect(isDiagEnabled()).toBe(true);
  });

  it("returns false in production when ENABLE_DIAG_ROUTES is not set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    expect(isDiagEnabled()).toBe(false);
  });

  it("returns true in production when ENABLE_DIAG_ROUTES is true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DIAG_ROUTES", "true");
    expect(isDiagEnabled()).toBe(true);
  });

  it("returns false in production when ENABLE_DIAG_ROUTES is other value", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DIAG_ROUTES", "1");
    expect(isDiagEnabled()).toBe(false);
  });
});
