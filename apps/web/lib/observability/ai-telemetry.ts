/**
 * Phase 8 — AI route telemetry. Safe metadata only; no prompts/secrets/raw user text.
 */

import { getBuildStamp } from "@/lib/config/public";
import { logStructured } from "./logger";
import type { IntelligenceDiagnosticsPayload } from "./intelligence-diagnostics";

export type AIErrorKind =
  | "auth_failure"
  | "tenant_failure"
  | "validation_failure"
  | "provider_unavailable"
  | "provider_timeout"
  | "rate_limit"
  | "stream_transport_failure"
  | "stream_parse_failure"
  | "fallback_invoked"
  | "persistence_failure"
  | "output_validation_failure"
  | "missing_data_degradation"
  | "cancellation"
  | "unknown_internal_error";

export type CopilotStreamLifecycle =
  | "stream_started"
  | "first_token"
  | "stream_completed"
  | "stream_error"
  | "stream_cancelled";

export interface AITelemetryBase {
  request_id: string;
  route: string;
  tenant_id?: string | null;
  project_id?: string | null;
  user_id?: string | null;
  latency_ms: number;
  output_type: "copilot" | "intelligence" | "vision";
  /** Release correlation (optional) */
  build_sha7?: string;
  app_env?: string;
}

export interface CopilotStreamTelemetry extends AITelemetryBase {
  output_type: "copilot";
  streaming: true;
  context_tokens_estimated?: number;
  context_trim_applied?: boolean;
  memory_used?: number;
  memory_chunks_count?: number;
  summary_used?: number;
  provider?: string;
  cancellation_detected?: boolean;
  error_kind?: AIErrorKind | null;
  retryable?: boolean;
  /** Ms from stream start to first model token */
  first_token_ms?: number | null;
}

export interface IntelligenceTelemetry extends AITelemetryBase {
  output_type: "intelligence";
  data_sufficiency?: string;
  health_score?: number;
  insights_count?: number;
  missing_data_disclaimer?: boolean;
  intelligence_diagnostics?: IntelligenceDiagnosticsPayload;
}

export interface VisionTelemetry extends AITelemetryBase {
  output_type: "vision";
  provider?: string;
  result_status: "success" | "failure";
  error_kind?: AIErrorKind | null;
  media_id?: string | null;
}

const LIFECYCLE_EVENTS: Record<CopilotStreamLifecycle, string> = {
  stream_started: "ai_copilot_stream_started",
  first_token: "ai_copilot_stream_first_token",
  stream_completed: "ai_copilot_stream_finished",
  stream_error: "ai_copilot_stream_failed",
  stream_cancelled: "ai_copilot_stream_cancelled",
};

export function logCopilotStreamLifecycle(
  phase: CopilotStreamLifecycle,
  payload: {
    request_id: string;
    route: string;
    tenant_id?: string | null;
    project_id?: string | null;
    latency_ms?: number;
    error_kind?: AIErrorKind;
    retryable?: boolean;
    first_token_ms?: number;
    build_sha7?: string;
    app_env?: string;
  }
): void {
  logStructured({
    event: LIFECYCLE_EVENTS[phase],
    stream_phase: phase,
    ...payload,
  });
}

export function logCopilotStreamComplete(payload: CopilotStreamTelemetry): void {
  logStructured({
    event: "ai_copilot_stream_complete",
    ...payload,
  });
}

export function logCopilotStreamError(payload: {
  request_id: string;
  route: string;
  tenant_id?: string | null;
  project_id?: string | null;
  latency_ms: number;
  error_kind: AIErrorKind;
  retryable: boolean;
  build_sha7?: string;
  app_env?: string;
}): void {
  logStructured({
    event: "ai_copilot_stream_error",
    ...payload,
  });
}

export function logIntelligenceComplete(payload: IntelligenceTelemetry): void {
  logStructured({
    event: "ai_intelligence_complete",
    ...payload,
  });
}

export function logIntelligenceError(payload: {
  request_id: string;
  route: string;
  tenant_id?: string | null;
  project_id?: string | null;
  latency_ms: number;
  error_kind: AIErrorKind;
  build_sha7?: string;
  app_env?: string;
}): void {
  logStructured({
    event: "ai_intelligence_error",
    ...payload,
  });
}

/** Non-stream copilot (brief) completion. Includes fallback visibility. */
export interface CopilotNonStreamTelemetry extends AITelemetryBase {
  output_type: "copilot";
  streaming: false;
  fallback_triggered: boolean;
  fallback_reason?: string | null;
  fallback_target_path?: string | null;
  use_case?: string;
  provider?: string;
}

export function logCopilotNonStreamComplete(payload: CopilotNonStreamTelemetry): void {
  logStructured({
    event: "ai_copilot_non_stream_complete",
    ...payload,
  });
}

export function logVisionAnalyzeComplete(payload: VisionTelemetry): void {
  logStructured({
    event: "ai_vision_analyze_complete",
    ...payload,
  });
}

/** Build / environment fields for release correlation (safe for logs). */
export function getAiReleaseCorrelation(): { build_sha7?: string; app_env?: string } {
  const { sha } = getBuildStamp();
  const appEnv =
    (typeof process.env.NEXT_PUBLIC_APP_ENV === "string" && process.env.NEXT_PUBLIC_APP_ENV.trim()) ||
    process.env.NODE_ENV ||
    "";
  return {
    ...(sha && { build_sha7: sha.slice(0, 7) }),
    ...(appEnv && { app_env: appEnv }),
  };
}

export function logVisionAnalyzeError(payload: {
  request_id: string;
  route: string;
  tenant_id?: string | null;
  project_id?: string | null;
  latency_ms: number;
  error_kind: AIErrorKind;
  http_status?: number;
  build_sha7?: string;
  app_env?: string;
}): void {
  logStructured({
    event: "ai_vision_analyze_error",
    ...payload,
  });
}
