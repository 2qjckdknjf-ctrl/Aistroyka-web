import { describe, expect, it, vi } from "vitest";
import { getApnsProvider, isApnsConfigured } from "./apns.provider";

describe("apns.provider", () => {
  it("isApnsConfigured is false when env not set", () => {
    vi.stubEnv("APNS_TEAM_ID", "");
    vi.stubEnv("APNS_KEY_ID", "");
    vi.stubEnv("APNS_BUNDLE_ID", "");
    vi.stubEnv("APNS_PRIVATE_KEY", "");
    expect(isApnsConfigured()).toBe(false);
  });

  it("isApnsConfigured is true when all env set", () => {
    vi.stubEnv("APNS_TEAM_ID", "T1");
    vi.stubEnv("APNS_KEY_ID", "K1");
    vi.stubEnv("APNS_BUNDLE_ID", "com.example.app");
    vi.stubEnv("APNS_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg\n-----END PRIVATE KEY-----");
    expect(isApnsConfigured()).toBe(true);
  });

  it("getApnsProvider returns null when not configured", () => {
    vi.stubEnv("APNS_TEAM_ID", "");
    expect(getApnsProvider()).toBeNull();
  });

  it("getApnsProvider returns provider when configured", () => {
    vi.stubEnv("APNS_TEAM_ID", "T1");
    vi.stubEnv("APNS_KEY_ID", "K1");
    vi.stubEnv("APNS_BUNDLE_ID", "com.example.app");
    vi.stubEnv("APNS_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg\n-----END PRIVATE KEY-----");
    const p = getApnsProvider();
    expect(p).not.toBeNull();
    expect(typeof p?.send).toBe("function");
  });
});
