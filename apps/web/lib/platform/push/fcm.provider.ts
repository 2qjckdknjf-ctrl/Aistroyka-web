/**
 * FCM legacy push provider (server key). Env-gated.
 * Env: FCM_SERVER_KEY. Used when FCM HTTP v1 (service account) is not configured.
 * Router prefers FCM v1 when FCM_PROJECT_ID/FCM_CLIENT_EMAIL/FCM_PRIVATE_KEY are set.
 */

import type { PushProvider, PushSendParams, PushSendResult } from "./push.provider.types";

function isFcmConfigured(): boolean {
  return Boolean(process.env.FCM_SERVER_KEY?.trim());
}

/** Legacy FCM: send via FCM legacy HTTP API with server key. */
async function sendFcmLegacy(params: PushSendParams): Promise<PushSendResult> {
  const key = process.env.FCM_SERVER_KEY?.trim();
  if (!key) return { ok: false, code: "retryable", message: "FCM not configured" };
  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${key}`,
      },
      body: JSON.stringify({
        to: params.token,
        notification: params.title || params.body ? { title: params.title, body: params.body } : undefined,
        data: params.data ?? {},
        collapse_key: params.collapseKey,
        time_to_live: params.ttlSec,
      }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    if (res.status === 400 && /InvalidRegistration|NotRegistered|InvalidParameters/.test(text)) {
      return { ok: false, code: "invalid_token", message: text };
    }
    if (res.status === 401) return { ok: false, code: "auth_error", message: text };
    return { ok: false, code: "retryable", message: text || String(res.status) };
  } catch (e) {
    return { ok: false, code: "retryable", message: e instanceof Error ? e.message : String(e) };
  }
}

const fcmProvider: PushProvider = {
  async send(params: PushSendParams): Promise<PushSendResult> {
    if (params.platform !== "android") return { ok: false, code: "retryable", message: "FCM is Android only" };
    if (!isFcmConfigured()) return { ok: false, code: "retryable", message: "FCM not configured" };
    return sendFcmLegacy(params);
  },
};

export function getFcmProvider(): PushProvider | null {
  return isFcmConfigured() ? fcmProvider : null;
}

export { isFcmConfigured };
