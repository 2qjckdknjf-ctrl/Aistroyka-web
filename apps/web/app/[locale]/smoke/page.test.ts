import { afterEach, describe, expect, it, vi } from "vitest";

const headerValues = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => headerValues.get(name.toLowerCase()) ?? null }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("./SmokeClient", () => ({ default: () => null }));

import SmokePage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  headerValues.clear();
});

describe("smoke page gate", () => {
  it("returns 404 in production without debug flags", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_DIAG", "");
    vi.stubEnv("ENABLE_DIAG_ROUTES", "");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "");
    headerValues.set("host", "aistroyka.ai");
    await expect(SmokePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns 404 in production when the host is not allow-listed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_DIAG", "true");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "internal.example.com");
    headerValues.set("host", "aistroyka.ai");
    await expect(SmokePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders in production for an allow-listed host with DEBUG_DIAG", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEBUG_DIAG", "true");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "internal.example.com");
    headerValues.set("host", "internal.example.com");
    await expect(SmokePage()).resolves.toBeTruthy();
  });

  it("renders in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEBUG_HOSTS", "");
    headerValues.set("host", "localhost:3000");
    await expect(SmokePage()).resolves.toBeTruthy();
  });
});
