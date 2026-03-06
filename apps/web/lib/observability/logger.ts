/**
 * Structured JSON logger. Standard event schema for aggregators.
 * No PII, no secrets. Minimal but consistent.
 */

import { getServerConfig } from "@/lib/config/server";

const REDACT_KEYS = new Set(["token", "password", "secret", "authorization", "cookie", "api_key", "apikey"]);

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase();
    if (REDACT_KEYS.has(keyLower) || keyLower.includes("token") || keyLower.includes("secret")) continue;
    out[k] = v;
  }
  return out;
}

export type LogEvent = {
  event: string;
  request_id?: string | null;
  traceId?: string;
  tenantId?: string | null;
  userId?: string | null;
  route?: string;
  method?: string;
  status?: string | number;
  duration_ms?: number;
  error_type?: string;
  error_code?: string;
  component?: string;
  [key: string]: unknown;
};

export function logStructured(payload: LogEvent): void {
  if (getServerConfig().NODE_ENV === "test") return;
  const sanitized = sanitize(payload);
  console.log(
    JSON.stringify({
      ...sanitized,
      ts: new Date().toISOString(),
    })
  );
}

export function logInfo(event: string, fields: Omit<LogEvent, "event"> = {}): void {
  logStructured({ ...fields, event });
}

export function logWarn(event: string, fields: Omit<LogEvent, "event"> = {}): void {
  logStructured({ ...fields, event });
}

export function logError(event: string, fields: Omit<LogEvent, "event"> = {}): void {
  logStructured({ ...fields, event });
}
