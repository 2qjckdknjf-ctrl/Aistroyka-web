/**
 * Log levels for the logging layer.
 * Use via logger; avoid console.log in services.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function isLevelEnabled(configured: LogLevel, messageLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[messageLevel] >= LOG_LEVEL_ORDER[configured];
}

export function getConfiguredLogLevel(): LogLevel {
  const v = (process.env.LOG_LEVEL ?? "info").trim().toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return "info";
}
