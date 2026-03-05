/**
 * FCM HTTP v1 provider (service account OAuth2). Env-gated.
 * Env: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY. Optional: FCM_TOKEN_URI.
 */

import type { PushProvider, PushSendParams, PushSendResult } from "../push.provider.types";
import { getAccessToken } from "./google-oauth";

const FCM_SEND_URL = "https://fcm.googleapis.com/v1/projects";

function isFcmV1Configured(): boolean {
  return Boolean(
    process.env.FCM_PROJECT_ID?.trim() &&
      process.env.FCM_CLIENT_EMAIL?.trim() &&
      process.env.FCM_PRIVATE_KEY?.trim()
  );
}

/** Map data to FCM format (string values only). */
function toDataPayload(data?: Record<string, string | number | boolean>): Record<string, string> | undefined {
  if (!data || Object.keys(data).length === 0) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

async function sendFcmV1(params: PushSendParams): Promise<PushSendResult> {
  const projectId = process.env.FCM_PROJECT_ID?.trim();
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FCM_PRIVATE_KEY?.trim();
  const tokenUri = process.env.FCM_TOKEN_URI?.trim() || undefined;
  if (!projectId || !clientEmail || !privateKey) {
    return { ok: false, code: "retryable", message: "FCM v1 not configured" };
  }

  const accessToken = await getAccessToken({ clientEmail, privateKeyPem: privateKey, tokenUri });
  if (!accessToken) {
    return { ok: false, code: "auth_error", message: "Failed to obtain FCM access token" };
  }

  const url = `${FCM_SEND_URL}/${projectId}/messages:send`;
  const body = {
    message: {
      token: params.token,
      notification:
        params.title || params.body
          ? { title: params.title ?? "", body: params.body ?? "" }
          : undefined,
      data: toDataPayload(params.data),
      android: {
        collapse_key: params.collapseKey,
        ttl: params.ttlSec ? `${params.ttlSec}s` : undefined,
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return { ok: true };

    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      return { ok: false, code: "auth_error", message: text || String(res.status) };
    }
    if (res.status === 400) {
      const invalidToken =
        /INVALID_ARGUMENT|NOT_FOUND|UNREGISTERED|invalid.*token/i.test(text) ||
        /InvalidRegistration|NotRegistered/i.test(text);
      if (invalidToken) {
        return { ok: false, code: "invalid_token", message: text };
      }
    }
    return { ok: false, code: "retryable", message: text || String(res.status) };
  } catch (e) {
    return {
      ok: false,
      code: "retryable",
      message: e instanceof Error ? e.message : String(e),
    };
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

export { isFcmV1Configured };
