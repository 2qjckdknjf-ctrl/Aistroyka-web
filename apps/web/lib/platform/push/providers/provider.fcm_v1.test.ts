import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { getFcmV1Provider, isFcmV1Configured } from "./provider.fcm_v1";
import type { PushSendParams } from "../push.provider.types";

vi.mock("./google-oauth", () => ({
  getGoogleAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
  clearGoogleTokenCache: vi.fn(),
}));

function validTestKey(): string {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 512 });
  return privateKey.export({ type: "pkcs8", format: "pem" }) as string;
}

describe("provider.fcm_v1", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv("FCM_PROJECT_ID", "");
    vi.stubEnv("FCM_CLIENT_EMAIL", "");
    vi.stubEnv("FCM_PRIVATE_KEY", "");
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("isFcmV1Configured is false when any of project_id, client_email, private_key missing", () => {
    expect(isFcmV1Configured()).toBe(false);
    vi.stubEnv("FCM_PROJECT_ID", "proj");
    expect(isFcmV1Configured()).toBe(false);
    vi.stubEnv("FCM_CLIENT_EMAIL", "a@b.iam.gserviceaccount.com");
    expect(isFcmV1Configured()).toBe(false);
    vi.stubEnv("FCM_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----");
    expect(isFcmV1Configured()).toBe(true);
  });

  it("getFcmV1Provider returns null when not configured", () => {
    expect(getFcmV1Provider()).toBeNull();
  });

  it("getFcmV1Provider returns provider when configured and send shapes FCM v1 request", async () => {
    vi.stubEnv("FCM_PROJECT_ID", "my-proj");
    vi.stubEnv("FCM_CLIENT_EMAIL", "fcm@my-proj.iam.gserviceaccount.com");
    vi.stubEnv("FCM_PRIVATE_KEY", validTestKey());

    let capturedUrl: string | null = null;
    let capturedBody: string | null = null;
    const mockFetch = vi.fn((url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedBody = init?.body as string ?? null;
      return Promise.resolve(new Response(undefined, { status: 200 }));
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = getFcmV1Provider();
    expect(provider).not.toBeNull();

    const params: PushSendParams = {
      platform: "android",
      token: "device-fcm-token",
      title: "Hi",
      body: "Body",
      data: { key: "value" },
    };

    const result = await provider!.send(params);

    expect(result.ok).toBe(true);
    expect(capturedUrl).toBe("https://fcm.googleapis.com/v1/projects/my-proj/messages:send");
    expect(capturedBody).not.toBeNull();
    const body = JSON.parse(capturedBody!);
    expect(body.message.token).toBe("device-fcm-token");
    expect(body.message.notification).toEqual({ title: "Hi", body: "Body" });
    expect(body.message.data).toEqual({ key: "value" });
  });

  it("send returns invalid_token for 404 UNREGISTERED", async () => {
    vi.stubEnv("FCM_PROJECT_ID", "p");
    vi.stubEnv("FCM_CLIENT_EMAIL", "e@p.iam.gserviceaccount.com");
    vi.stubEnv("FCM_PRIVATE_KEY", validTestKey());

    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ error: { message: "UNREGISTERED" } }),
          { status: 404 }
        )
      )
    ));

    const provider = getFcmV1Provider();
    expect(provider).not.toBeNull();

    const result = await provider!.send({
      platform: "android",
      token: "t",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_token");
  });
});
