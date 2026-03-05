/**
 * FCM HTTP v1 provider (service account). Env-gated.
 * Env: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY. Optional: FCM_TOKEN_URI.
 */

import type { PushProvider, PushSendParams, PushSendResult } from "../push.provider.types";
import { getGoogleAccessToken } from "./google-oauth";

const FCM_V1_SEND_URL = "https://fcm.googleapis.com/v1/projects";

export function isFcmV1Configured(): boolean {
  return Boolean(
    process.env.FCM_PROJECT_ID?.trim() &&
      process.env.FCM_CLIENT_EMAIL?.trim() &&
      process.env.FCM_PRIVATE_KEY?.trim()
  );
}

/** Send via FCM HTTP v1 messages:send. */
export async function sendFcmV1(params: PushSendParams): Promise<PushSendResult> {
  const projectId = process.env.FCM_PROJECT_ID?.trim();
  if (!projectId) return { ok: false, code: "retryable", message: "FCM project not configured" };

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return { ok: false, code: "auth_error", message: "Failed to obtain FCM access token" };

  const url = `${FCM_V1_SEND_URL}/${projectId}/messages:send`;
  const message: Record<string, unknown> = {
    token: params.token,
    notification:
      params.title || params.body
        ? { title: params.title ?? "", body: params.body ?? "" }
        : undefined,
    data: params.data
      ? Object.fromEntries(
          Object.entries(params.data).map(([k, v]) => [k, typeof v === "string" ? v : String(v)])
        )
      : undefined,
    android: {},
  };
  if (params.collapseKey) (message.android as Record<string, string>)["collapse_key"] = params.collapseKey;
  if (params.ttlSec != null) (message.android as Record<string, string>)["ttl"] = `${params.ttlSec}s`;

  const body = { message };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (res.ok) return { ok: true };

    if (res.status === 401 || res.status === 403) {
      return { ok: false, code: "auth_error", message: text || String(res.status) };
    }
    if (res.status === 404 || (res.status === 400 && /NOT_FOUND|UNREGISTERED|INVALID_ARGUMENT|invalid.*token/i.test(text))) {
      return { ok: false, code: "invalid_token", message: text || String(res.status) };
    }
    return { ok: false, code: "retryable", message: text || String(res.status) };
  } catch (e) {
    return { ok: false, code: "retryable", message: e instanceof Error ? e.message : String(e) };
  }
}

const fcmV1Provider: PushProvider = {
  async send(params: PushSendParams): Promise<PushSendResult> {
    if (params.platform !== "android") {
      return { ok: false, code: "retryable", message: "FCM is Android only" };
    }
    if (!isFcmV1Configured()) {
      return { ok: false, code: "retryable", message: "FCM v1 not configured" };
    }
    return sendFcmV1(params);
  },
};

export function getFcmV1Provider(): PushProvider | null {
  return isFcmV1Configured() ? fcmV1Provider : null;
}
