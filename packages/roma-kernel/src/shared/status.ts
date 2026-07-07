/** Operational health status for components, probes, and surfaces. */
export type RomaHealthStatus =
  | "healthy"
  | "degraded"
  | "warning"
  | "unavailable"
  | "not_configured"
  | "unknown";

/** Product / module maturity (information architecture). */
export type RomaMaturityStatus = "live" | "partial" | "planned" | "coming_soon" | "available";

/** Probe source connection state. */
export type RomaProbeConnectionStatus = "connected" | "unavailable";

/** Audit pass/fail posture (safe readonly audit). */
export type RomaAuditOutcomeStatus = "pass" | "degraded" | "fail" | "unknown";

/** Product area impact classification. */
export type RomaImpactStatus = "affected" | "not_affected" | "unknown";

/** Executive health bucket (UI rollup only — derived, not probed directly). */
export type RomaHealthBucket = "critical" | "warning" | "unknown" | "healthy";
