/**
 * Tenant dashboard AI readiness labels for honesty UI.
 * Never returns LIVE — live activation remains gated outside this surface.
 */

export type DashboardAiReadiness =
  | "not_configured"
  | "configured_unverified"
  | "degraded";

export type DashboardAiReadinessBadgeVariant = "neutral" | "warning" | "danger";

export function resolveDashboardAiReadiness(input: {
  visionConfigured: boolean | null | undefined;
  failedCount?: number;
  deadCount?: number;
}): DashboardAiReadiness {
  if (input.visionConfigured === false) {
    return "not_configured";
  }

  const failed = (input.failedCount ?? 0) + (input.deadCount ?? 0);
  if (failed > 0) {
    return "degraded";
  }

  // Keys may be present, but LIVE gate is not proven on this surface.
  return "configured_unverified";
}

export function dashboardAiReadinessBadgeVariant(
  readiness: DashboardAiReadiness
): DashboardAiReadinessBadgeVariant {
  switch (readiness) {
    case "not_configured":
      return "neutral";
    case "configured_unverified":
      return "warning";
    case "degraded":
      return "danger";
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}

export function isFalseLiveReadinessLabel(label: string): boolean {
  return /\blive\b/i.test(label.trim());
}
