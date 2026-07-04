import { buildRomaEngineeringIntelligence } from "./roma-engineering-intelligence";
import {
  buildRomaQualityDashboardFromProbes,
} from "./roma-quality-dashboard.service";
import type { LiveProbeBundle } from "./roma-live-probes";
import { runLiveProbes } from "./roma-live-probes";
import type {
  RomaReadonlyAuditEvidence,
  RomaReadonlyAuditEvidenceBundle,
  RomaReadonlyAuditFinding,
  RomaReadonlyAuditRecommendation,
  RomaSafeReadonlyAudit,
  RomaSafeReadonlyAuditRefreshResponse,
  RomaSafeReadonlyAuditSourceId,
  RomaSafeReadonlyAuditStatus,
} from "./roma-safe-readonly-audit.types";
import {
  ROMA_SAFE_READONLY_AUDIT_FORBIDDEN,
  ROMA_SAFE_READONLY_AUDIT_SOURCES,
} from "./roma-safe-readonly-audit.types";
import type { QualityStatus, RomaQualityDashboard } from "./roma-quality-dashboard.types";

function probeStatus(connected: boolean, ok?: boolean): QualityStatus {
  if (!connected) return "unavailable";
  if (ok === false) return "degraded";
  return "healthy";
}

function auditIdFromTimestamp(iso: string): string {
  let hash = 0;
  for (let i = 0; i < iso.length; i++) {
    hash = (Math.imul(31, hash) + iso.charCodeAt(i)) | 0;
  }
  return `safe-audit-v1-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function evidenceItem(
  sourceId: RomaSafeReadonlyAuditSourceId,
  label: string,
  status: QualityStatus,
  summary: string,
  collectedAt: string,
  detail: string | null
): RomaReadonlyAuditEvidence {
  return { sourceId, label, status, summary, collectedAt, detail };
}

function buildEvidenceFromProbes(
  probes: LiveProbeBundle,
  collectedAt: string
): RomaReadonlyAuditEvidence[] {
  const health = probes.health.data;
  const items: RomaReadonlyAuditEvidence[] = [
    evidenceItem(
      "health_endpoint",
      "Health endpoint",
      probeStatus(probes.health.connected, health?.ok),
      probes.health.summary,
      collectedAt,
      health ? `db=${health.db}; ok=${health.ok}; sha7=${health.buildSha7 ?? "—"}` : probes.health.error
    ),
    evidenceItem(
      "roma_live_probes",
      "ROMA live probes bundle",
      probes.health.connected || probes.systemHealth.connected ? "healthy" : "unavailable",
      `Probes checked at ${probes.checkedAt}.`,
      collectedAt,
      `system=${probes.systemHealth.summary}; storage=${probes.storage.summary}`
    ),
    evidenceItem(
      "build_stamp",
      "Build stamp",
      probes.gitMetadata.connected ? "healthy" : "unavailable",
      probes.gitMetadata.summary,
      collectedAt,
      probes.gitMetadata.data
        ? `sha=${probes.gitMetadata.data.sha?.slice(0, 7) ?? "—"}; branch=${probes.gitMetadata.data.branch ?? "—"}`
        : probes.gitMetadata.error
    ),
    evidenceItem(
      "release_env_validation",
      "Release environment validation",
      probes.releaseEnv.data?.verdict === "FAIL"
        ? "unavailable"
        : probes.releaseEnv.data?.verdict === "PASS"
          ? "healthy"
          : probeStatus(probes.releaseEnv.connected),
      probes.releaseEnv.summary,
      collectedAt,
      probes.releaseEnv.data?.verdictReason ?? probes.releaseEnv.error
    ),
    evidenceItem(
      "storage_readonly_probe",
      "Storage availability (read-only)",
      probes.storage.data?.status === "healthy"
        ? "healthy"
        : probes.storage.data?.status === "not_configured"
          ? "not_configured"
          : probeStatus(probes.storage.connected),
      probes.storage.summary,
      collectedAt,
      probes.storage.data?.hasMediaBucket != null
        ? `hasMediaBucket=${probes.storage.data.hasMediaBucket}`
        : probes.storage.error
    ),
    evidenceItem(
      "database_connectivity_probe",
      "Database connectivity (read-only)",
      health?.db === "ok" ? "healthy" : health?.db ? "degraded" : "unavailable",
      probes.migrations.summary,
      collectedAt,
      health ? `health.db=${health.db}; supabaseReachable=${health.supabaseReachable}` : probes.migrations.error
    ),
    evidenceItem(
      "ai_provider_configuration",
      "AI provider configuration",
      probes.ai.data?.openai || probes.ai.data?.gemini || (probes.ai.data?.visionProviders.length ?? 0) > 0
        ? "healthy"
        : probes.ai.connected
          ? "degraded"
          : "unavailable",
      probes.ai.summary,
      collectedAt,
      probes.ai.data
        ? `openai=${probes.ai.data.openai}; gemini=${probes.ai.data.gemini}; vision=${probes.ai.data.visionProviders.join(",") || "none"}`
        : probes.ai.error
    ),
    evidenceItem(
      "platform_admin_access_summary",
      "Platform admin access status",
      probes.platformAudit.connected ? "healthy" : "unavailable",
      probes.platformAudit.summary,
      collectedAt,
      probes.releaseEnv.data
        ? `releaseVerdict=${probes.releaseEnv.data.verdict}; forbiddenInProd=${probes.releaseEnv.data.forbiddenInProdSet.length}`
        : probes.platformAudit.error
    ),
  ];
  return items;
}

function buildSnapshotEvidence(
  dashboard: RomaQualityDashboard,
  intelligenceSummary: string,
  collectedAt: string
): RomaReadonlyAuditEvidence[] {
  return [
    evidenceItem(
      "quality_dashboard_snapshot",
      "Quality dashboard snapshot",
      dashboard.platformStatus.overallHealth,
      `Overall health: ${dashboard.platformStatus.overallHealthLabel}; coverage ${dashboard.dataCoverage.coveragePercent}%.`,
      collectedAt,
      `Release readiness: ${dashboard.platformStatus.releaseReadiness}; blockers=${dashboard.blockers.length}.`
    ),
    evidenceItem(
      "engineering_intelligence_snapshot",
      "Engineering intelligence snapshot",
      dashboard.dataCoverage.coveragePercent >= 40 ? "healthy" : dashboard.dataCoverage.coveragePercent > 0 ? "degraded" : "unknown",
      intelligenceSummary,
      collectedAt,
      `Confidence ${dashboard.platformStatus.overallHealthLabel}.`
    ),
  ];
}

export async function collectReadonlyEvidence(): Promise<RomaReadonlyAuditEvidenceBundle> {
  const probes = await runLiveProbes();
  const dashboard = buildRomaQualityDashboardFromProbes(probes);
  const intelligence = buildRomaEngineeringIntelligence(dashboard);
  const collectedAt = new Date().toISOString();

  const evidence = [
    ...buildEvidenceFromProbes(probes, collectedAt),
    ...buildSnapshotEvidence(dashboard, intelligence.engineeringAssessment, collectedAt),
  ];

  return {
    collectedAt,
    dashboardGeneratedAt: dashboard.generatedAt,
    environmentLabel: dashboard.environment.label,
    probeCoveragePercent: dashboard.dataCoverage.coveragePercent,
    evidence,
    releaseDecision: intelligence.releaseDecision,
    releaseDecisionLabel: intelligence.releaseDecisionLabel,
    confidence: intelligence.confidenceScore,
    confidencePercent: intelligence.confidencePercent,
    engineeringIssueCount: intelligence.topRisks.length,
    dashboardBlockerCount: dashboard.blockers.length,
  };
}

export function evaluateReadonlyAudit(bundle: RomaReadonlyAuditEvidenceBundle): {
  status: RomaSafeReadonlyAuditStatus;
  findings: RomaReadonlyAuditFinding[];
  recommendations: RomaReadonlyAuditRecommendation[];
} {
  const findings: RomaReadonlyAuditFinding[] = [];
  const recommendations: RomaReadonlyAuditRecommendation[] = [];

  for (const item of bundle.evidence) {
    if (item.status === "unavailable") {
      findings.push({
        id: `finding-${item.sourceId}-unavailable`,
        severity: item.sourceId === "health_endpoint" || item.sourceId === "database_connectivity_probe" ? "critical" : "warning",
        title: `${item.label} unavailable`,
        evidence: item.summary,
        sourceId: item.sourceId,
      });
    } else if (item.status === "degraded") {
      findings.push({
        id: `finding-${item.sourceId}-degraded`,
        severity: "warning",
        title: `${item.label} degraded`,
        evidence: item.summary,
        sourceId: item.sourceId,
      });
    } else if (item.status === "unknown" || item.status === "not_configured") {
      findings.push({
        id: `finding-${item.sourceId}-unknown`,
        severity: "information",
        title: `${item.label} not fully verified`,
        evidence: item.summary,
        sourceId: item.sourceId,
      });
    }
  }

  if (bundle.probeCoveragePercent === 0) {
    findings.push({
      id: "finding-coverage-zero",
      severity: "critical",
      title: "No live probe coverage",
      evidence: "Data coverage is 0% — audit confidence is insufficient.",
      sourceId: "derived",
    });
  } else if (bundle.probeCoveragePercent < 40) {
    findings.push({
      id: "finding-coverage-low",
      severity: "warning",
      title: "Low live probe coverage",
      evidence: `Probe coverage is ${bundle.probeCoveragePercent}%.`,
      sourceId: "derived",
    });
  }

  if (bundle.releaseDecision === "not_ready") {
    findings.push({
      id: "finding-release-not-ready",
      severity: "critical",
      title: "Release not ready per engineering intelligence",
      evidence: bundle.releaseDecisionLabel,
      sourceId: "engineering_intelligence_snapshot",
    });
  }

  if (bundle.dashboardBlockerCount > 0) {
    findings.push({
      id: "finding-dashboard-blockers",
      severity: "warning",
      title: "Quality dashboard reports blockers",
      evidence: `${bundle.dashboardBlockerCount} blocker(s) in dashboard snapshot.`,
      sourceId: "quality_dashboard_snapshot",
    });
  }

  for (const item of bundle.evidence.filter((e) => e.status === "unavailable" || e.status === "degraded")) {
    recommendations.push({
      id: `rec-${item.sourceId}`,
      title: `Investigate ${item.label}`,
      evidence: item.detail ?? item.summary,
      sourceId: item.sourceId,
    });
  }

  if (bundle.confidence === "low" || bundle.probeCoveragePercent === 0) {
    recommendations.push({
      id: "rec-increase-coverage",
      title: "Increase probe coverage before release decisions",
      evidence: `Confidence=${bundle.confidence}; coverage=${bundle.probeCoveragePercent}%.`,
      sourceId: "derived",
    });
  }

  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasWarning = findings.some((f) => f.severity === "warning");
  const allUnknown = bundle.evidence.every((e) => e.status === "unknown" || e.status === "unavailable");

  let status: RomaSafeReadonlyAuditStatus;
  if (allUnknown || bundle.confidence === "low" && bundle.probeCoveragePercent === 0) {
    status = "unknown";
  } else if (hasCritical || bundle.releaseDecision === "not_ready") {
    status = "fail";
  } else if (hasWarning || bundle.releaseDecision === "ready_with_warnings") {
    status = "degraded";
  } else if (bundle.releaseDecision === "ready") {
    status = "pass";
  } else {
    status = "unknown";
  }

  return {
    status,
    findings: findings.sort((a, b) => a.id.localeCompare(b.id)),
    recommendations: recommendations.sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function getReadonlyAuditLimitations(): readonly string[] {
  return [
    "Read-only probes only — no catalog test execution, Playwright, or mobile simulators",
    "No CI triggers, deploys, DB writes, or feature-flag changes",
    "Manual refresh recomputes snapshot via owner-only API — no persistence or run history",
    "Production mutation never performed; production targets are not probed for writes",
    "Confidence degrades when service role or probe sources are unavailable",
    "Release recommendation is advisory — owner must confirm before any release action",
    "Full test catalog execution remains disabled (executionEnabled: false)",
  ];
}

export function summarizeReadonlyAudit(audit: RomaSafeReadonlyAudit): string {
  return [
    `Safe Readonly Audit ${audit.auditId} (${audit.status}).`,
    `Mode: ${audit.mode}. Confidence: ${audit.confidence}.`,
    `Release: ${audit.releaseRecommendationLabel}.`,
    `${audit.evidence.length} evidence sources; ${audit.findings.length} findings; ${audit.recommendations.length} recommendations.`,
    audit.summary,
  ].join(" ");
}

export async function createSafeReadonlyAudit(): Promise<RomaSafeReadonlyAudit> {
  const createdAt = new Date().toISOString();
  const bundle = await collectReadonlyEvidence();
  const evaluation = evaluateReadonlyAudit(bundle);
  const limitations = getReadonlyAuditLimitations();

  const summary = [
    `Safe readonly audit for ${bundle.environmentLabel}.`,
    `Status: ${evaluation.status}; probe coverage ${bundle.probeCoveragePercent}%.`,
    `Release recommendation: ${bundle.releaseDecisionLabel}.`,
  ].join(" ");

  return {
    version: "v1",
    auditId: auditIdFromTimestamp(createdAt),
    createdAt,
    mode: "SAFE_READONLY_AUDIT",
    status: evaluation.status,
    executionEnabled: false,
    evidence: bundle.evidence,
    findings: evaluation.findings,
    recommendations: evaluation.recommendations,
    limitations,
    releaseRecommendation: bundle.releaseDecision,
    releaseRecommendationLabel: bundle.releaseDecisionLabel,
    confidence: bundle.confidence,
    confidencePercent: bundle.confidencePercent,
    summary,
    allowedSources: ROMA_SAFE_READONLY_AUDIT_SOURCES,
    forbiddenActions: ROMA_SAFE_READONLY_AUDIT_FORBIDDEN,
  };
}

export function getSafeReadonlyAuditMeta(): {
  version: "v1";
  executionEnabled: false;
  mode: "SAFE_READONLY_AUDIT";
  refreshApiPath: "/api/v1/platform/testing/safe-audit/refresh";
} {
  return {
    version: "v1",
    executionEnabled: false,
    mode: "SAFE_READONLY_AUDIT",
    refreshApiPath: "/api/v1/platform/testing/safe-audit/refresh",
  };
}

/** Owner-only refresh payload — calls createSafeReadonlyAudit(), no persistence. */
export async function buildSafeReadonlyAuditRefreshResponse(): Promise<RomaSafeReadonlyAuditRefreshResponse> {
  const audit = await createSafeReadonlyAudit();
  return {
    audit,
    generatedAt: audit.createdAt,
    mode: audit.mode,
    limitations: audit.limitations,
    forbiddenActions: audit.forbiddenActions,
  };
}

/** For tests — evaluate from mock bundle without live probes. */
export function createSafeReadonlyAuditFromBundle(
  bundle: RomaReadonlyAuditEvidenceBundle,
  createdAt?: string
): RomaSafeReadonlyAudit {
  const ts = createdAt ?? new Date().toISOString();
  const evaluation = evaluateReadonlyAudit(bundle);
  const summary = `Mock safe readonly audit for ${bundle.environmentLabel}. Status: ${evaluation.status}.`;

  return {
    version: "v1",
    auditId: auditIdFromTimestamp(ts),
    createdAt: ts,
    mode: "SAFE_READONLY_AUDIT",
    status: evaluation.status,
    executionEnabled: false,
    evidence: bundle.evidence,
    findings: evaluation.findings,
    recommendations: evaluation.recommendations,
    limitations: getReadonlyAuditLimitations(),
    releaseRecommendation: bundle.releaseDecision,
    releaseRecommendationLabel: bundle.releaseDecisionLabel,
    confidence: bundle.confidence,
    confidencePercent: bundle.confidencePercent,
    summary,
    allowedSources: ROMA_SAFE_READONLY_AUDIT_SOURCES,
    forbiddenActions: ROMA_SAFE_READONLY_AUDIT_FORBIDDEN,
  };
}
