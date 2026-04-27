/**
 * Lightweight error/warning model for runtime plan integration.
 * No heavy exception framework; typed warnings and narrow domain errors.
 */

export type RuntimePlanWarningCode =
  | "workspace_plan_source_missing"
  | "unsupported_legacy_tier"
  | "invalid_add_on_code"
  | "inconsistent_runtime_plan_data"
  | "usage_snapshot_unavailable";

export interface RuntimePlanWarning {
  code: RuntimePlanWarningCode;
  message: string;
}

export interface RuntimePlanResultMeta {
  warnings: RuntimePlanWarning[];
  /** When true, fallback was used (e.g. no tier -> client_personal). */
  usedFallback?: boolean;
  /** Resolved source summary for audit. */
  resolvedSource?: "canonical_plan" | "legacy_tier_bridge" | "safe_default";
}
