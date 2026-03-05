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
    const result = await attemptSend({
      platform: "android",
      token: "t",
      body: "b",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("retryable");
  });
});
