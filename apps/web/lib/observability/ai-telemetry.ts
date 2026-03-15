/**
 * Phase 8 — AI route telemetry. Safe metadata only; no prompts/secrets.
 */

import { logStructured } from "./logger";

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

export interface AITelemetryBase {
  request_id: string;
  route: string;
  tenant_id?: string | null;
  project_id?: string | null;
  user_id?: string | null;
  latency_ms: number;
  output_type: "copilot" | "intelligence" | "vision";
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
}

export interface IntelligenceTelemetry extends AITelemetryBase {
  output_type: "intelligence";
  data_sufficiency?: string;
  health_score?: number;
  insights_count?: number;
  missing_data_disclaimer?: boolean;
}

export interface VisionTelemetry extends AITelemetryBase {
  output_type: "vision";
  provider?: string;
  result_status: "success" | "failure";
  error_kind?: AIErrorKind | null;
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
