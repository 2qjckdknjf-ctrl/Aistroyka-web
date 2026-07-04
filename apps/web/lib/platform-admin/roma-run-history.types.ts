/**
 * ROMA Safe Audit Run History types.
 * See docs/audits/ROMA_RUN_HISTORY_DESIGN.md and ROMA_RUN_HISTORY_IMPLEMENTATION_V1_REPORT.md
 */

import type { ConfidenceLevel, ReleaseDecision } from "./roma-engineering-intelligence.types";
import type { RomaSafeReadonlyAudit, RomaSafeReadonlyAuditMode, RomaSafeReadonlyAuditStatus } from "./roma-safe-readonly-audit.types";

/** Recommended storage backend for AISTROYKA (design verdict). */
export type RomaAuditRunStorageBackend = "supabase_table";

/** `public.roma_audit_runs` row. */
export type RomaAuditRunRecord = {
  id: string;
  created_at: string;
  created_by_user_id: string | null;
  /** SHA-256 prefix of normalized email — never store raw email in history row. */
  created_by_email_hash: string | null;
  mode: RomaSafeReadonlyAuditMode;
  status: RomaSafeReadonlyAuditStatus;
  release_recommendation: ReleaseDecision;
  confidence: ConfidenceLevel;
  coverage_percent: number | null;
  critical_count: number;
  warning_count: number;
  evidence_summary: RomaAuditRunEvidenceSummaryJson;
  findings_summary: RomaAuditRunFindingsSummaryJson;
  recommendations_summary: RomaAuditRunRecommendationsSummaryJson;
  limitations: readonly string[];
  source_version: string;
  build_sha: string | null;
  environment: string;
  raw_payload_redacted: RomaAuditRunRedactedPayload;
  retention_until: string;
};

export type RomaAuditRunEvidenceSummaryJson = {
  items: readonly { sourceId: string; status: string; label: string }[];
};

export type RomaAuditRunFindingsSummaryJson = {
  items: readonly { id: string; severity: string; title: string }[];
};

export type RomaAuditRunRecommendationsSummaryJson = {
  items: readonly { id: string; title: string }[];
};

/** Redacted JSON stored in `raw_payload_redacted` — safe for platform-owner review. */
export type RomaAuditRunRedactedPayload = {
  version: "v1";
  auditId: string;
  mode: RomaSafeReadonlyAuditMode;
  status: RomaSafeReadonlyAuditStatus;
  executionEnabled: false;
  releaseRecommendation: ReleaseDecision;
  releaseRecommendationLabel: string;
  confidence: ConfidenceLevel;
  confidencePercent: number | null;
  summary: string;
  allowedSources: readonly string[];
  forbiddenActions: readonly string[];
  evidence: readonly RomaAuditRunRedactedEvidence[];
  findings: readonly RomaAuditRunRedactedFinding[];
  recommendations: readonly RomaAuditRunRedactedRecommendation[];
  redaction: RomaAuditRunRedactionMeta;
};

export type RomaAuditRunRedactedEvidence = {
  sourceId: string;
  label: string;
  status: string;
  summary: string;
  detail: string | null;
};

export type RomaAuditRunRedactedFinding = {
  id: string;
  severity: string;
  title: string;
  evidence: string;
  sourceId: string;
};

export type RomaAuditRunRedactedRecommendation = {
  id: string;
  title: string;
  evidence: string;
  sourceId: string;
};

export type RomaAuditRunRedactionMeta = {
  redacted: boolean;
  kinds: readonly RomaAuditRunRedactionKind[];
  redactedFieldCount: number;
};

export type RomaAuditRunRedactionKind =
  | "email"
  | "phone"
  | "api_key"
  | "bearer_token"
  | "jwt"
  | "service_role"
  | "connection_string"
  | "ip_address";

/** List row for /platform-admin/testing/audit-runs UI (summary only — no raw payload). */
export type RomaAuditRunListItem = {
  id: string;
  createdAt: string;
  createdByUserId: string | null;
  createdByEmailHash: string | null;
  mode: RomaSafeReadonlyAuditMode;
  status: RomaSafeReadonlyAuditStatus;
  releaseRecommendation: ReleaseDecision;
  confidence: ConfidenceLevel;
  coveragePercent: number | null;
  criticalCount: number;
  warningCount: number;
  environment: string;
  buildSha: string | null;
  retentionUntil: string;
  sourceVersion: string;
  evidenceSummary: RomaAuditRunEvidenceSummaryJson;
  findingsSummary: RomaAuditRunFindingsSummaryJson;
  recommendationsSummary: RomaAuditRunRecommendationsSummaryJson;
};

export type RomaAuditRunSaveResult = {
  runId: string;
  createdAt: string;
  status: RomaSafeReadonlyAuditStatus;
  releaseRecommendation: ReleaseDecision;
  confidence: ConfidenceLevel;
  environment: string;
  buildSha: string | null;
  retentionUntil: string;
};

/** Compare view for two saved runs (design). */
export type RomaAuditRunComparison = {
  baselineRunId: string;
  targetRunId: string;
  statusChanged: boolean;
  releaseRecommendationChanged: boolean;
  confidenceChanged: boolean;
  coverageDelta: number | null;
  newFindings: readonly string[];
  resolvedFindings: readonly string[];
  summary: string;
};

/** Explicit save intent — no automatic persistence. */
export type RomaAuditRunSaveIntent = "save_snapshot" | "refresh_and_save";

export const ROMA_AUDIT_RUN_RETENTION_DAYS = 90;

export const ROMA_AUDIT_RUN_SOURCE_VERSION = "roma-safe-readonly-audit-v1";

/** Fields never stored even after redaction attempt. */
export const ROMA_AUDIT_RUN_FORBIDDEN_STORAGE_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "GITHUB_REVIEWER_TOKEN",
  "CLOUDFLARE_ACCESS_API_TOKEN",
  "stripe_secret",
  "password",
  "refresh_token",
  "access_token",
] as const;
