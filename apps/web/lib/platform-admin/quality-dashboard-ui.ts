import type { QualityStatus, ReadinessLevel, BlockerSeverity } from "./roma-quality-dashboard.types";

export function qualityStatusBadgeVariant(
  status: QualityStatus
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "unavailable":
      return "danger";
    case "unknown":
    case "not_configured":
      return "neutral";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function readinessBadgeVariant(
  level: ReadinessLevel
): "success" | "warning" | "danger" | "neutral" {
  switch (level) {
    case "ready":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
      return "danger";
    case "unknown":
      return "neutral";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function blockerSeverityBadgeVariant(
  severity: BlockerSeverity
): "success" | "warning" | "danger" | "neutral" {
  switch (severity) {
    case "critical":
      return "danger";
    case "warning":
      return "warning";
    case "information":
      return "neutral";
    case "unknown":
      return "neutral";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

export function formatPercent(percent: number | null): string {
  if (percent === null) return "Unknown";
  return `${percent}%`;
}

export function formatTimestamp(value: string | null): string {
  if (!value) return "Unknown";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}
