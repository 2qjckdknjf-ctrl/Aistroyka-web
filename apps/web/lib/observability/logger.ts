/**
 * Structured JSON logger. Standard event schema for aggregators.
 * No PII. Minimal but consistent.
 */

import { getServerConfig } from "@/lib/config/server";

export type LogEvent = {
  event: string;
  traceId?: string;
  tenantId?: string | null;
  userId?: string | null;
  route?: string;
  status?: string | number;
  duration_ms?: number;
  error_type?: string;
};

export function logStructured(payload: LogEvent): void {
  if (getServerConfig().NODE_ENV === "test") return;
  console.log(
    JSON.stringify({
      ...payload,
      ts: new Date().toISOString(),
    })
  );
}
