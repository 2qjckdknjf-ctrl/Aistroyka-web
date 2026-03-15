/**
 * Type-based fallback href when alerts table has no resource_type/resource_id.
 * Used by AlertFeed.
 */

export function getAlertFallbackHref(type: string): string | null {
  switch (type) {
    case "ai_budget_exceeded":
    case "ai_budget_soft_exceeded":
    case "job_fail_spike":
      return "/dashboard/ai";
    case "slo_breach":
      return "/dashboard";
    case "quota_spike":
      return "/dashboard";
    default:
      return "/dashboard/alerts";
  }
}
