import { describe, expect, it, vi } from "vitest";
import {
  getDebugConfig,
  isDebugAllowedForRequest,
  isDebugAuthAllowed,
  isDebugDiagAllowed,
  isProductionDebugSafe,
} from "./debug";

describe("debug config", () => {
  it("production + flag off => debug auth and diag blocked (isDebugAuthAllowed false when host not allowed)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_AUTH", undefined);
    vi.stubEnv("DEBUG_DIAG", undefined);
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    vi.stubEnv("ALLOW_DEBUG_HOSTS", undefined);

    expect(getDebugConfig().debugAuth).toBe(false);
    expect(getDebugConfig().debugDiag).toBe(false);
    expect(isDebugAllowedForRequest({ headers: { get: () => "app.example.com" } } as Request)).toBe(false);
    expect(isDebugAuthAllowed({ headers: { get: () => "app.example.com" } } as Request)).toBe(false);
    expect(isDebugDiagAllowed({ headers: { get: () => "app.example.com" } } as Request)).toBe(false);
  });

  it("production + flag on but host not in ALLOW_DEBUG_HOSTS => blocked", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_AUTH", "true");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "internal.example.com,staging.example.com");

    expect(getDebugConfig().debugAuth).toBe(true);
    expect(isDebugAllowedForRequest({ headers: { get: () => "public.example.com" } } as Request)).toBe(false);
    expect(isDebugAuthAllowed({ headers: { get: () => "public.example.com" } } as Request)).toBe(false);
  });

  it("production + flag on + host in ALLOW_DEBUG_HOSTS => allowed", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_AUTH", "true");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "internal.example.com");

    expect(isDebugAllowedForRequest({ headers: { get: () => "internal.example.com" } } as Request)).toBe(true);
    expect(isDebugAuthAllowed({ headers: { get: () => "internal.example.com" } } as Request)).toBe(true);
  });

  it("non-production => allowed when no allowlist (default)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", undefined);

    expect(isDebugAllowedForRequest({ headers: { get: () => "localhost:3000" } } as Request)).toBe(true);
  });

  it("isProductionDebugSafe: production with no debug flags => true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_AUTH", undefined);
    vi.stubEnv("DEBUG_DIAG", undefined);
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    expect(isProductionDebugSafe()).toBe(true);
  });

  it("isProductionDebugSafe: production with DEBUG_AUTH but no ALLOW_DEBUG_HOSTS => false", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_AUTH", "true");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "");
    expect(isProductionDebugSafe()).toBe(false);
  });

  it("isProductionDebugSafe: production with DEBUG_AUTH and ALLOW_DEBUG_HOSTS set => true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_AUTH", "true");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "internal.example.com");
    expect(isProductionDebugSafe()).toBe(true);
  });
});
