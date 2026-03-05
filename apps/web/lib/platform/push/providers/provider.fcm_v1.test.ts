import { describe, expect, it, vi, beforeEach } from "vitest";
import { getFcmV1Provider, isFcmV1Configured } from "./provider.fcm_v1";

vi.mock("./google-oauth", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-oauth-token"),
}));

describe("provider.fcm_v1", () => {
  beforeEach(() => {
    vi.stubEnv("FCM_PROJECT_ID", "");
    vi.stubEnv("FCM_CLIENT_EMAIL", "");
    vi.stubEnv("FCM_PRIVATE_KEY", "");
    vi.restoreAllMocks();
  });

  it("isFcmV1Configured returns false when env not set", () => {
    expect(isFcmV1Configured()).toBe(false);
  });

  it("isFcmV1Configured returns true when project_id, client_email, private_key set", () => {
    vi.stubEnv("FCM_PROJECT_ID", "my-project");
    vi.stubEnv("FCM_CLIENT_EMAIL", "a@b.iam.gserviceaccount.com");
    vi.stubEnv("FCM_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\n\n-----END PRIVATE KEY-----");
    expect(isFcmV1Configured()).toBe(true);
  });

  it("getFcmV1Provider returns null when not configured", () => {
    expect(getFcmV1Provider()).toBeNull();
  });

  it("send returns retryable for non-android platform", async () => {
    vi.stubEnv("FCM_PROJECT_ID", "p");
    vi.stubEnv("FCM_CLIENT_EMAIL", "e@e.com");
    vi.stubEnv("FCM_PRIVATE_KEY", "key");
    const provider = getFcmV1Provider();
    expect(provider).not.toBeNull();
    const result = await provider!.send({
      platform: "ios",
      token: "t",
      body: "b",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("retryable");
  });

  it("send shapes FCM v1 request and returns ok when fetch succeeds", async () => {
    vi.stubEnv("FCM_PROJECT_ID", "my-project");
    vi.stubEnv("FCM_CLIENT_EMAIL", "fcm@proj.iam.gserviceaccount.com");
    vi.stubEnv("FCM_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\n\n-----END PRIVATE KEY-----");

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    const provider = getFcmV1Provider();
    expect(provider).not.toBeNull();
    const result = await provider!.send({
      platform: "android",
      token: "device-fcm-token",
      title: "Hi",
      body: "Body",
      data: { key: "value" },
    });

    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://fcm.googleapis.com/v1/projects/my-project/messages:send");
    expect(opts?.method).toBe("POST");
    expect(opts?.headers?.Authorization).toBe("Bearer mock-oauth-token");
    const body = JSON.parse(opts?.body as string);
    expect(body.message.token).toBe("device-fcm-token");
    expect(body.message.notification).toEqual({ title: "Hi", body: "Body" });
    expect(body.message.data).toEqual({ key: "value" });
  });

  it("send returns invalid_token on 400 with invalid token message", async () => {
    vi.stubEnv("FCM_PROJECT_ID", "p");
    vi.stubEnv("FCM_CLIENT_EMAIL", "e@e.com");
    vi.stubEnv("FCM_PRIVATE_KEY", "key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("NOT_FOUND"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = getFcmV1Provider();
    const result = await provider!.send({
      platform: "android",
      token: "bad",
      body: "b",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_token");
  });
});
