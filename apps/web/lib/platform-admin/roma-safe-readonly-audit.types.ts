import type { ConfidenceLevel, ReleaseDecision } from "./roma-engineering-intelligence.types";
import type { QualityStatus } from "./roma-quality-dashboard.types";

/** V1 safe readonly audit mode — no catalog test execution. */
export type RomaSafeReadonlyAuditMode = "SAFE_READONLY_AUDIT";

export type RomaSafeReadonlyAuditStatus = "pass" | "degraded" | "fail" | "unknown";

/** Allowed evidence sources for V1 (read-only probes and snapshots only). */
export const ROMA_SAFE_READONLY_AUDIT_SOURCES = [
  "health_endpoint",
  "roma_live_probes",
  "build_stamp",
  "release_env_validation",
  "storage_readonly_probe",
  "database_connectivity_probe",
  "ai_provider_configuration",
  "platform_admin_access_summary",
  "quality_dashboard_snapshot",
  "engineering_intelligence_snapshot",
] as const;

export type RomaSafeReadonlyAuditSourceId = (typeof ROMA_SAFE_READONLY_AUDIT_SOURCES)[number];

/** Actions permanently forbidden by the safe readonly audit runner. */
export const ROMA_SAFE_READONLY_AUDIT_FORBIDDEN = [
  "ci_trigger",
  "playwright_execution",
  "maestro_execution",
  "appium_execution",
  "xctest_execution",
  "production_mutation",
  "db_writes",
  "feature_flag_changes",
  "deploys",
  "migrations_apply",
  "destructive_external_calls",
  "catalog_test_execution",
] as const;

export type RomaSafeReadonlyAuditForbiddenAction =
  (typeof ROMA_SAFE_READONLY_AUDIT_FORBIDDEN)[number];

export type RomaReadonlyAuditEvidence = {
  sourceId: RomaSafeReadonlyAuditSourceId;
  label: string;
  status: QualityStatus;
  summary: string;
  collectedAt: string;
  detail: string | null;
};

export type RomaReadonlyAuditFinding = {
  id: string;
  severity: "critical" | "warning" | "information";
  title: string;
  evidence: string;
  sourceId: RomaSafeReadonlyAuditSourceId | "derived";
};

export type RomaReadonlyAuditRecommendation = {
  id: string;
  title: string;
  evidence: string;
  sourceId: RomaSafeReadonlyAuditSourceId | "derived";
};

export type RomaSafeReadonlyAudit = {
  version: "v1";
  auditId: string;
  createdAt: string;
  mode: RomaSafeReadonlyAuditMode;
  status: RomaSafeReadonlyAuditStatus;
  /** Catalog/full test execution remains disabled. */
  executionEnabled: false;
  evidence: readonly RomaReadonlyAuditEvidence[];
  findings: readonly RomaReadonlyAuditFinding[];
  recommendations: readonly RomaReadonlyAuditRecommendation[];
  limitations: readonly string[];
  releaseRecommendation: ReleaseDecision;
  releaseRecommendationLabel: string;
  confidence: ConfidenceLevel;
  confidencePercent: number | null;
  summary: string;
  allowedSources: readonly RomaSafeReadonlyAuditSourceId[];
  forbiddenActions: readonly RomaSafeReadonlyAuditForbiddenAction[];
};

export type RomaReadonlyAuditEvidenceBundle = {
  collectedAt: string;
  dashboardGeneratedAt: string;
  environmentLabel: string;
  probeCoveragePercent: number;
  evidence: readonly RomaReadonlyAuditEvidence[];
  releaseDecision: ReleaseDecision;
  releaseDecisionLabel: string;
  confidence: ConfidenceLevel;
  confidencePercent: number | null;
  engineeringIssueCount: number;
  dashboardBlockerCount: number;
};
