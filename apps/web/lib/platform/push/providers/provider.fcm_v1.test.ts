import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFcmV1Provider } from "./provider.fcm_v1";
import * as googleOauth from "./google-oauth";
import type { PushSendParams } from "../push.provider.types";

describe("provider.fcm_v1", () => {
  const baseParams: PushSendParams = {
    platform: "android",
    token: "fcm-device-token",
    title: "Title",
    body: "Body",
    data: { key: "value" },
  };

  beforeEach(() => {
    vi.stubEnv("FCM_PROJECT_ID", "my-project");
    vi.stubEnv("FCM_CLIENT_EMAIL", "fcm@proj.iam.gserviceaccount.com");
    vi.stubEnv("FCM_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----");
    vi.spyOn(googleOauth, "getGoogleAccessToken").mockResolvedValue("mock-bearer-token");
  });

  it("sends POST to FCM v1 URL with Bearer token", async () => {
    let capturedUrl = "";
    let capturedBody: unknown = null;
    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return Promise.resolve({ ok: true, text: () => Promise.resolve("") });
    });
    const provider = getFcmV1Provider();
    expect(provider).toBeTruthy();
    await provider!.send(baseParams);
    expect(capturedUrl).toContain("https://fcm.googleapis.com/v1/projects/my-project/messages:send");
    expect(capturedBody).toEqual(
      expect.objectContaining({
        message: expect.objectContaining({
          token: baseParams.token,
          notification: { title: "Title", body: "Body" },
          data: { key: "value" },
        }),
      })
    );
    const callHeaders = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(callHeaders?.Authorization).toBe("Bearer mock-bearer-token");
  });

  it("returns ok: true when FCM returns 200", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
    const provider = getFcmV1Provider();
    const result = await provider!.send(baseParams);
    expect(result.ok).toBe(true);
  });

  it("returns invalid_token on 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("NOT_FOUND"),
    });
    const provider = getFcmV1Provider();
    const result = await provider!.send(baseParams);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_token");
  });

  it("returns auth_error on 401", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });
    const provider = getFcmV1Provider();
    const result = await provider!.send(baseParams);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("auth_error");
  });

  it("returns retryable on 503", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve("Unavailable"),
    });
    const provider = getFcmV1Provider();
    const result = await provider!.send(baseParams);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("retryable");
  });
});
