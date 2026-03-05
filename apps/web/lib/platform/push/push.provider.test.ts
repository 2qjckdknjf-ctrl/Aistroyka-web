import { describe, expect, it, vi } from "vitest";
import { attemptSend, getProviderForPlatform } from "./push.provider.router";
import type { PushSendParams } from "./push.provider.types";

vi.mock("./providers/provider.fcm_v1", () => ({
  getFcmV1Provider: vi.fn(),
}));

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

  it("router prefers FCM v1 when service account env is set", async () => {
    const { getFcmV1Provider } = await import("./providers/provider.fcm_v1");
    const mockSend = vi.fn().mockResolvedValue({ ok: true });
    vi.mocked(getFcmV1Provider).mockReturnValueOnce({ send: mockSend } as any);
    vi.stubEnv("FCM_SERVER_KEY", "");
    const result = await attemptSend({
      platform: "android",
      token: "t",
      body: "b",
    });
    expect(result.ok).toBe(true);
    expect(getFcmV1Provider).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ platform: "android", token: "t", body: "b" })
    );
  });

  it("router uses legacy FCM when only FCM_SERVER_KEY is set", async () => {
    vi.stubEnv("FCM_PROJECT_ID", "");
    vi.stubEnv("FCM_CLIENT_EMAIL", "");
    vi.stubEnv("FCM_PRIVATE_KEY", "");
    vi.stubEnv("FCM_SERVER_KEY", "legacy-key");
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);
    const result = await attemptSend({
      platform: "android",
      token: "t",
      body: "b",
    });
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://fcm.googleapis.com/fcm/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "key=legacy-key" }),
      })
    );
  });
});
