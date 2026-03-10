/**
 * Production-safe error visibility layer.
 * Logs structured error events; can be extended to forward to an external provider (e.g. Sentry).
 * No secrets or unsafe PII. Correlation with request_id when provided.
 */

import { logStructured } from "./logger";

/** Normalized error categories for triage and dashboards. */
export type ErrorCategory =
  | "auth"
  | "tenant_context"
  | "report_submit"
  | "upload"
  | "sync"
  | "task_assign"
  | "review_action"
  | "notification"
  | "api_5xx"
  | "api_4xx"
  | "unknown";

/** Severity for prioritization. */
export type ErrorSeverity = "fatal" | "error" | "warn" | "info";

export interface CaptureExceptionContext {
  request_id?: string | null;
  route?: string;
  tenant_id?: string | null;
  user_id?: string | null;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  /** Optional code or error code from domain (e.g. task_invalid). */
  code?: string | null;
}

/**
 * Capture an exception for observability. Logs structured event; in future can forward to Sentry etc.
 * Do not pass raw tokens or PII in context.
 */
export function captureException(
  error: unknown,
  context: CaptureExceptionContext = {}
): void {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "Error";
  const { request_id, route, tenant_id, user_id, category, severity, code } = context;
  logStructured({
    event: "error_captured",
    error_name: name,
    error_message: message.length > 500 ? message.slice(0, 500) + "…" : message,
    request_id: request_id ?? undefined,
    route,
    tenant_id: tenant_id ?? undefined,
    user_id: user_id ?? undefined,
    category: category ?? "unknown",
    severity: severity ?? "error",
    code: code ?? undefined,
  });
}

/**
 * Severity guidance by category (for default when not provided).
 */
export const SEVERITY_BY_CATEGORY: Record<ErrorCategory, ErrorSeverity> = {
  auth: "error",
  tenant_context: "error",
  report_submit: "error",
  upload: "error",
  sync: "warn",
  task_assign: "error",
  review_action: "error",
  notification: "warn",
  api_5xx: "error",
  api_4xx: "info",
  unknown: "error",
};
