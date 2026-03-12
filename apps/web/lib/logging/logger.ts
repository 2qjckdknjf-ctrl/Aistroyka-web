/**
 * Lightweight logging layer. Use in services instead of console.log.
 * Delegates to observability logStructured; respects LOG_LEVEL.
 */

import { logStructured } from "@/lib/observability";
import { getConfiguredLogLevel, isLevelEnabled, type LogLevel } from "./log-levels";

const configured = getConfiguredLogLevel();

function emit(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV === "test") return;
  if (!isLevelEnabled(configured, level)) return;
  logStructured({ ...fields, event, level });
}

export function debug(event: string, fields: Record<string, unknown> = {}): void {
  emit("debug", event, fields);
}

export function info(event: string, fields: Record<string, unknown> = {}): void {
  emit("info", event, fields);
}

export function warn(event: string, fields: Record<string, unknown> = {}): void {
  emit("warn", event, fields);
}

export function error(event: string, fields: Record<string, unknown> = {}): void {
  emit("error", event, fields);
}
