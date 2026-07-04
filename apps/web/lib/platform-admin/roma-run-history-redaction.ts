/**
 * ROMA audit run history — redaction helpers and draft builder.
 */

import { createHash } from "node:crypto";
import type { RomaSafeReadonlyAudit } from "./roma-safe-readonly-audit.types";
import type {
  RomaAuditRunEvidenceSummaryJson,
  RomaAuditRunFindingsSummaryJson,
  RomaAuditRunRecommendationsSummaryJson,
  RomaAuditRunRedactedPayload,
  RomaAuditRunRedactionKind,
  RomaAuditRunRedactionMeta,
  RomaAuditRunRecord,
} from "./roma-run-history.types";
import {
  ROMA_AUDIT_RUN_RETENTION_DAYS,
  ROMA_AUDIT_RUN_SOURCE_VERSION,
} from "./roma-run-history.types";

const REDACTION_MASK = "[REDACTED]";

const REDACTION_PATTERNS: readonly { kind: RomaAuditRunRedactionKind; pattern: RegExp }[] = [
  { kind: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { kind: "phone", pattern: /\+?[\d\s\-()]{10,}/g },
  { kind: "api_key", pattern: /\b(sk|pk)[_-][a-zA-Z0-9]{10,}\b/g },
  { kind: "bearer_token", pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi },
  { kind: "jwt", pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  {
    kind: "service_role",
    pattern: /\b(SUPABASE_SERVICE_ROLE_KEY|service_role|SERVICE_ROLE)\s*[=:]\s*\S+/gi,
  },
  {
    kind: "connection_string",
    pattern: /\b(postgres(ql)?|mysql):\/\/[^\s"']+/gi,
  },
  { kind: "ip_address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
];

function redactString(input: string): { text: string; kinds: RomaAuditRunRedactionKind[]; count: number } {
  let text = input;
  const kinds = new Set<RomaAuditRunRedactionKind>();
  let count = 0;

  for (const { kind, pattern } of REDACTION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      kinds.add(kind);
      count += matches.length;
      text = text.replace(pattern, REDACTION_MASK);
    }
  }

  return { text, kinds: [...kinds], count };
}

function buildRedactionMeta(kinds: RomaAuditRunRedactionKind[], fieldCount: number): RomaAuditRunRedactionMeta {
  return {
    redacted: kinds.length > 0 || fieldCount > 0,
    kinds: [...new Set(kinds)].sort(),
    redactedFieldCount: fieldCount,
  };
}

export function hashOwnerEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function computeRetentionUntil(createdAt: Date, retentionDays = ROMA_AUDIT_RUN_RETENTION_DAYS): string {
  const until = new Date(createdAt);
  until.setUTCDate(until.getUTCDate() + retentionDays);
  return until.toISOString();
}

export function buildAuditRunSummaries(audit: RomaSafeReadonlyAudit): {
  evidence_summary: RomaAuditRunEvidenceSummaryJson;
  findings_summary: RomaAuditRunFindingsSummaryJson;
  recommendations_summary: RomaAuditRunRecommendationsSummaryJson;
  critical_count: number;
  warning_count: number;
  coverage_percent: number | null;
} {
  const critical_count = audit.findings.filter((f) => f.severity === "critical").length;
  const warning_count = audit.findings.filter((f) => f.severity === "warning").length;

  const evidenceHealthy = audit.evidence.filter((e) => e.status === "healthy").length;
  const coverage_percent =
    audit.evidence.length > 0 ? Math.round((evidenceHealthy / audit.evidence.length) * 100) : null;

  return {
    evidence_summary: {
      items: audit.evidence.map((e) => ({
        sourceId: e.sourceId,
        status: e.status,
        label: e.label,
      })),
    },
    findings_summary: {
      items: audit.findings.map((f) => ({
        id: f.id,
        severity: f.severity,
        title: f.title,
      })),
    },
    recommendations_summary: {
      items: audit.recommendations.map((r) => ({
        id: r.id,
        title: r.title,
      })),
    },
    critical_count,
    warning_count,
    coverage_percent,
  };
}

export function redactAuditPayloadForStorage(audit: RomaSafeReadonlyAudit): RomaAuditRunRedactedPayload {
  const allKinds = new Set<RomaAuditRunRedactionKind>();
  let totalRedactions = 0;

  const redactField = (value: string): string => {
    const result = redactString(value);
    for (const kind of result.kinds) allKinds.add(kind);
    totalRedactions += result.count;
    return result.text;
  };

  const evidence = audit.evidence.map((item) => {
    const summary = redactField(item.summary);
    const detail = item.detail ? redactField(item.detail) : null;
    return {
      sourceId: item.sourceId,
      label: item.label,
      status: item.status,
      summary,
      detail,
    };
  });

  const findings = audit.findings.map((item) => ({
    id: item.id,
    severity: item.severity,
    title: redactField(item.title),
    evidence: redactField(item.evidence),
    sourceId: item.sourceId,
  }));

  const recommendations = audit.recommendations.map((item) => ({
    id: item.id,
    title: redactField(item.title),
    evidence: redactField(item.evidence),
    sourceId: item.sourceId,
  }));

  return {
    version: "v1",
    auditId: audit.auditId,
    mode: audit.mode,
    status: audit.status,
    executionEnabled: false,
    releaseRecommendation: audit.releaseRecommendation,
    releaseRecommendationLabel: audit.releaseRecommendationLabel,
    confidence: audit.confidence,
    confidencePercent: audit.confidencePercent,
    summary: redactField(audit.summary),
    allowedSources: audit.allowedSources,
    forbiddenActions: audit.forbiddenActions,
    evidence,
    findings,
    recommendations,
    redaction: buildRedactionMeta([...allKinds], totalRedactions),
  };
}

export function buildAuditRunRecordDraft(input: {
  audit: RomaSafeReadonlyAudit;
  createdByUserId: string | null;
  createdByEmail: string | null;
  environment: string;
  buildSha?: string | null;
  createdAt?: Date;
}): Omit<RomaAuditRunRecord, "id"> {
  const createdAt = input.createdAt ?? new Date();
  const summaries = buildAuditRunSummaries(input.audit);

  return {
    created_at: createdAt.toISOString(),
    created_by_user_id: input.createdByUserId,
    created_by_email_hash: input.createdByEmail ? hashOwnerEmail(input.createdByEmail) : null,
    mode: input.audit.mode,
    status: input.audit.status,
    release_recommendation: input.audit.releaseRecommendation,
    confidence: input.audit.confidence,
    coverage_percent: summaries.coverage_percent,
    critical_count: summaries.critical_count,
    warning_count: summaries.warning_count,
    evidence_summary: summaries.evidence_summary,
    findings_summary: summaries.findings_summary,
    recommendations_summary: summaries.recommendations_summary,
    limitations: input.audit.limitations,
    source_version: ROMA_AUDIT_RUN_SOURCE_VERSION,
    build_sha: input.buildSha ?? null,
    environment: input.environment,
    raw_payload_redacted: redactAuditPayloadForStorage(input.audit),
    retention_until: computeRetentionUntil(createdAt),
  };
}

export function compareAuditRunFindingTitles(
  baselineTitles: readonly string[],
  targetTitles: readonly string[]
): { newFindings: string[]; resolvedFindings: string[] } {
  const baseline = new Set(baselineTitles);
  const target = new Set(targetTitles);
  return {
    newFindings: [...target].filter((t) => !baseline.has(t)).sort(),
    resolvedFindings: [...baseline].filter((t) => !target.has(t)).sort(),
  };
}
