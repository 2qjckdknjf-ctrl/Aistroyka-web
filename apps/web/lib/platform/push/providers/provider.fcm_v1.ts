/**
 * FCM HTTP v1 provider (service account). Env-gated.
 * Env: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY. Optional: FCM_TOKEN_URI.
 */

import type { PushProvider, PushSendParams, PushSendResult } from "../push.provider.types";
import { getGoogleAccessToken } from "./google-oauth";

const FCM_V1_SEND_URL = (projectId: string) =>
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

function getConfig(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const projectId = process.env.FCM_PROJECT_ID?.trim();
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FCM_PRIVATE_KEY?.trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function isFcmV1Configured(): boolean {
  return getConfig() !== null;
}

function mapFcmError(status: number, body: string): PushSendResult {
  if (status === 400 || status === 404) {
    if (
      /INVALID_ARGUMENT|NOT_FOUND|UNREGISTERED|invalid.*registration/i.test(body)
    ) {
      return { ok: false, code: "invalid_token", message: body };
    }
  }
  if (status === 401 || status === 403) {
    return { ok: false, code: "auth_error", message: body };
  }
  return { ok: false, code: "retryable", message: body || String(status) };
}

async function sendFcmV1(params: PushSendParams): Promise<PushSendResult> {
  const config = getConfig();
  if (!config) return { ok: false, code: "retryable", message: "FCM v1 not configured" };
  if (params.platform !== "android") {
    return { ok: false, code: "retryable", message: "FCM is Android only" };
  }

  const token = await getGoogleAccessToken({
    clientEmail: config.clientEmail,
    privateKeyPem: config.privateKey,
    tokenUri: process.env.FCM_TOKEN_URI?.trim() || undefined,
  });
  if (!token) {
    return { ok: false, code: "auth_error", message: "Failed to obtain access token" };
  }

  const message = {
    message: {
      token: params.token,
      notification:
        params.title || params.body
          ? { title: params.title ?? "", body: params.body ?? "" }
          : undefined,
      data: params.data
        ? Object.fromEntries(
            Object.entries(params.data).map(([k, v]) => [k, String(v)])
          )
        : undefined,
      android: {
        collapse_key: params.collapseKey ?? undefined,
        ttl: params.ttlSec ? `${params.ttlSec}s` : undefined,
      },
    },
  };

  const url = FCM_V1_SEND_URL(config.projectId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    return mapFcmError(res.status, text);
  } catch (e) {
    return {
      ok: false,
      code: "retryable",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

const fcmV1Provider: PushProvider = {
  send: sendFcmV1,
};

export function getFcmV1Provider(): PushProvider | null {
  return isFcmV1Configured() ? fcmV1Provider : null;
}
