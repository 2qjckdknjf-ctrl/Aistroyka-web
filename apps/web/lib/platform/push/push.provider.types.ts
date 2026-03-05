/**
 * Push provider abstraction. Implementations: APNS (iOS), FCM (Android).
 * Used by outbox drain job to send notifications.
 */

import type { PushPlatform } from "./push.types";

export interface PushSendParams {
  platform: PushPlatform;
  token: string;
  title?: string;
  body?: string;
  data?: Record<string, string | number | boolean>;
  collapseKey?: string;
  ttlSec?: number;
}

export type PushSendErrorCode = "invalid_token" | "retryable" | "auth_error";

export type PushSendResult =
  | { ok: true }
  | { ok: false; code: PushSendErrorCode; message?: string };

export interface PushProvider {
  send(params: PushSendParams): Promise<PushSendResult>;
}
