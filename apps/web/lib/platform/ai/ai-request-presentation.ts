/**
 * Safe presentation helpers for /api/v1/ai/requests (tenant UI).
 * Maps job status + error codes to user-facing message keys; never exposes secrets.
 */

import {
  AI_ERROR_CODES,
  sanitizeAIErrorForTenant,
  userMessageKeyForAIErrorCode,
  type AIUserMessageKey,
} from "./ai-media-errors";
import { isAnyVisionProviderConfigured } from "@/lib/config/server";

export type AIRequestStatus =
  "queued" | "running" | "success" | "failed" | "dead";

export function normalizeCreatedAtBound(
  value: string | undefined,
  kind: "from" | "to",
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Date-only YYYY-MM-DD → inclusive day bounds (fixes midnight truncation empty lists).
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return kind === "from"
      ? `${trimmed}T00:00:00.000Z`
      : `${trimmed}T23:59:59.999Z`;
  }
  return trimmed;
}

export function userMessageKeyForJobStatus(
  status: string,
  lastErrorType: string | null | undefined,
): AIUserMessageKey {
  switch (status) {
    case "queued":
      return "aiStatusQueued";
    case "running":
      return "aiStatusRunning";
    case "success":
      return "aiStatusSuccess";
    case "failed":
    case "dead":
      return userMessageKeyForAIErrorCode(lastErrorType);
    default:
      return "aiStatusFailed";
  }
}

export function presentAIRequestRow(row: {
  id: string;
  type: string;
  status: string;
  payload?: unknown;
  attempts: number;
  last_error?: string | null;
  last_error_type?: string | null;
  created_at: string;
  updated_at: string;
  max_attempts?: number;
}) {
  const payload = (row.payload ?? {}) as {
    report_id?: string;
    media_id?: string;
    upload_session_id?: string;
  };
  const entity =
    payload.report_id ?? payload.media_id ?? payload.upload_session_id ?? null;
  const lastErrorType = row.last_error_type ?? null;
  const userKey = userMessageKeyForJobStatus(row.status, lastErrorType);

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    entity,
    report_id: typeof payload.report_id === "string" && payload.report_id.trim()
      ? payload.report_id.trim()
      : null,
    media_id: typeof payload.media_id === "string" && payload.media_id.trim()
      ? payload.media_id.trim()
      : null,
    attempts: row.attempts,
    max_attempts: row.max_attempts ?? null,
    // Tenant-safe: code + sanitized short text; raw stack/paths stripped.
    last_error: sanitizeAIErrorForTenant(row.last_error ?? null),
    last_error_type: lastErrorType,
    user_message_key: userKey,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function visionConfiguredForEnv(): boolean {
  return isAnyVisionProviderConfigured();
}

export function isProviderConfigError(
  code: string | null | undefined,
): boolean {
  return code === AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED;
}
