import type { QualityStatus } from "./roma-quality-dashboard.types";
import type { ConfidenceLevel, ReleaseDecision } from "./roma-engineering-intelligence.types";

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

export function formatPercent(percent: number | null): string {
  if (percent === null) return "Unknown";
  return `${percent}%`;
}

export function confidenceBadgeVariant(
  level: ConfidenceLevel
): "success" | "warning" | "danger" | "neutral" {
  switch (level) {
    case "high":
      return "success";
    case "medium":
      return "warning";
    case "low":
      return "danger";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function releaseDecisionBadgeVariant(
  decision: ReleaseDecision
): "success" | "warning" | "danger" | "neutral" {
  switch (decision) {
    case "ready":
      return "success";
    case "ready_with_warnings":
      return "warning";
    case "not_ready":
      return "danger";
    case "unknown":
      return "neutral";
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

export function releaseDecisionBorderClass(decision: ReleaseDecision): string {
  switch (decision) {
    case "not_ready":
      return "border-l-4 border-l-red-600";
    case "unknown":
      return "border-l-4 border-dashed border-l-aistroyka-text-tertiary";
    case "ready_with_warnings":
      return "border-l-4 border-l-amber-500";
    case "ready":
      return "border-l-4 border-l-emerald-600";
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

export function productAreaStatusLabel(status: "affected" | "not_affected" | "unknown"): string {
  switch (status) {
    case "affected":
      return "Affected";
    case "not_affected":
      return "Not affected";
    case "unknown":
      return "Unknown";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function productAreaBadgeVariant(
  status: "affected" | "not_affected" | "unknown"
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "affected":
      return "warning";
    case "not_affected":
      return "success";
    case "unknown":
      return "neutral";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
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
