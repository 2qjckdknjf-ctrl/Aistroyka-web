import { describe, expect, it, vi } from "vitest";
import { attemptSend, getProviderForPlatform } from "./push.provider.router";
import type { PushSendParams } from "./push.provider.types";

describe("push provider router", () => {
  it("getProviderForPlatform returns null for unknown platform", () => {
    expect(getProviderForPlatform("")).toBeNull();
    expect(getProviderForPlatform("web")).toBeNull();
  });

  it("attemptSend returns retryable when no provider configured", async () => {
    vi.stubEnv("APNS_TEAM_ID", "");
    vi.stubEnv("APNS_KEY_ID", "");
    vi.stubEnv("APNS_PRIVATE_KEY", "");
    vi.stubEnv("APNS_BUNDLE_ID", "");
    vi.stubEnv("FCM_SERVER_KEY", "");
    const params: PushSendParams = {
      platform: "ios",
      token: "test-token",
      title: "Test",
      body: "Body",
    };
    const result = await attemptSend(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("retryable");
    }
  });

  it("attemptSend for android without FCM returns retryable", async () => {
    vi.stubEnv("FCM_SERVER_KEY", "");
    vi.stubEnv("FCM_PROJECT_ID", "");
    vi.stubEnv("FCM_CLIENT_EMAIL", "");
    vi.stubEnv("FCM_PRIVATE_KEY", "");
    const result = await attemptSend({
      platform: "android",
      token: "t",
      body: "b",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("retryable");
  });

  it("prefers FCM v1 when project_id/client_email/private_key set", async () => {
    vi.stubEnv("FCM_SERVER_KEY", "");
    vi.stubEnv("FCM_PROJECT_ID", "proj");
    vi.stubEnv("FCM_CLIENT_EMAIL", "fcm@proj.iam.gserviceaccount.com");
    vi.stubEnv("FCM_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
    globalThis.fetch = fetchMock;
    const mod = await import("./providers/google-oauth");
    vi.spyOn(mod, "getGoogleAccessToken").mockResolvedValue("mock-token");
    const result = await attemptSend({
      platform: "android",
      token: "t",
      body: "b",
    });
    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("fcm.googleapis.com/v1"))).toBe(true);
  });
});
