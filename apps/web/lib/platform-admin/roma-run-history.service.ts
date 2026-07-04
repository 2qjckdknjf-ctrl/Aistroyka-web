/**
 * ROMA audit run history — persistence service (service-role only).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSafeReadonlyAudit } from "./roma-safe-readonly-audit";
import type { RomaSafeReadonlyAudit } from "./roma-safe-readonly-audit.types";
import { buildAuditRunRecordDraft } from "./roma-run-history-redaction";
import type { RomaAuditRunListItem, RomaAuditRunSaveResult } from "./roma-run-history.types";
import { ROMA_AUDIT_RUN_FORBIDDEN_STORAGE_KEYS } from "./roma-run-history.types";

const LIST_COLUMNS =
  "id, created_at, created_by_user_id, created_by_email_hash, mode, status, release_recommendation, confidence, coverage_percent, critical_count, warning_count, evidence_summary, findings_summary, recommendations_summary, limitations, source_version, build_sha, environment, retention_until";

type DbRow = {
  id: string;
  created_at: string;
  created_by_user_id: string | null;
  created_by_email_hash: string | null;
  mode: string;
  status: string;
  release_recommendation: string;
  confidence: string;
  coverage_percent: number | null;
  critical_count: number;
  warning_count: number;
  evidence_summary: RomaAuditRunListItem["evidenceSummary"];
  findings_summary: RomaAuditRunListItem["findingsSummary"];
  recommendations_summary: RomaAuditRunListItem["recommendationsSummary"];
  limitations: string[];
  source_version: string;
  build_sha: string | null;
  environment: string;
  retention_until: string;
  raw_payload_redacted?: unknown;
};

export function extractEnvironmentFromAudit(audit: RomaSafeReadonlyAudit): string {
  const match = audit.summary.match(/for ([^.]+)\./);
  return match?.[1]?.trim() ?? "Unknown";
}

export function extractBuildShaFromAudit(audit: RomaSafeReadonlyAudit): string | null {
  const buildEvidence = audit.evidence.find((e) => e.sourceId === "build_stamp");
  if (!buildEvidence?.detail) return null;
  const shaMatch = buildEvidence.detail.match(/sha=([a-f0-9]+)/i);
  return shaMatch?.[1]?.slice(0, 7) ?? null;
}

export function assertPayloadSafeForStorage(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  for (const key of ROMA_AUDIT_RUN_FORBIDDEN_STORAGE_KEYS) {
    if (serialized.toLowerCase().includes(key.toLowerCase())) {
      throw new Error(`Forbidden storage key detected: ${key}`);
    }
  }
  if (/Bearer\s+[A-Za-z0-9\-._~+/]{20,}/i.test(serialized)) {
    throw new Error("Forbidden bearer token pattern in payload");
  }
}

function mapRowToListItem(row: DbRow): RomaAuditRunListItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id,
    createdByEmailHash: row.created_by_email_hash,
    mode: row.mode as RomaAuditRunListItem["mode"],
    status: row.status as RomaAuditRunListItem["status"],
    releaseRecommendation: row.release_recommendation as RomaAuditRunListItem["releaseRecommendation"],
    confidence: row.confidence as RomaAuditRunListItem["confidence"],
    coveragePercent: row.coverage_percent,
    criticalCount: row.critical_count,
    warningCount: row.warning_count,
    environment: row.environment,
    buildSha: row.build_sha,
    retentionUntil: row.retention_until,
    sourceVersion: row.source_version,
    evidenceSummary: row.evidence_summary,
    findingsSummary: row.findings_summary,
    recommendationsSummary: row.recommendations_summary,
  };
}

export async function saveAuditRunSnapshot(input: {
  admin: SupabaseClient;
  userId: string;
  ownerEmail: string | null;
}): Promise<RomaAuditRunSaveResult> {
  const audit = await createSafeReadonlyAudit();
  const draft = buildAuditRunRecordDraft({
    audit,
    createdByUserId: input.userId,
    createdByEmail: input.ownerEmail,
    environment: extractEnvironmentFromAudit(audit),
    buildSha: extractBuildShaFromAudit(audit),
  });

  assertPayloadSafeForStorage(draft.raw_payload_redacted);

  const { data, error } = await input.admin
    .from("roma_audit_runs")
    .insert({
      created_by_user_id: draft.created_by_user_id,
      created_by_email_hash: draft.created_by_email_hash,
      mode: draft.mode,
      status: draft.status,
      release_recommendation: draft.release_recommendation,
      confidence: draft.confidence,
      coverage_percent: draft.coverage_percent,
      critical_count: draft.critical_count,
      warning_count: draft.warning_count,
      evidence_summary: draft.evidence_summary,
      findings_summary: draft.findings_summary,
      recommendations_summary: draft.recommendations_summary,
      limitations: draft.limitations,
      source_version: draft.source_version,
      build_sha: draft.build_sha,
      environment: draft.environment,
      raw_payload_redacted: draft.raw_payload_redacted,
      retention_until: draft.retention_until,
    })
    .select("id, created_at, status, release_recommendation, confidence, environment, build_sha, retention_until")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "roma_audit_run_insert_failed");
  }

  return {
    runId: data.id,
    createdAt: data.created_at,
    status: data.status as RomaAuditRunSaveResult["status"],
    releaseRecommendation: data.release_recommendation as RomaAuditRunSaveResult["releaseRecommendation"],
    confidence: data.confidence as RomaAuditRunSaveResult["confidence"],
    environment: data.environment,
    buildSha: data.build_sha,
    retentionUntil: data.retention_until,
  };
}

export async function listAuditRunSummaries(
  admin: SupabaseClient,
  limit = 20
): Promise<RomaAuditRunListItem[]> {
  const { data, error } = await admin
    .from("roma_audit_runs")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToListItem(row as DbRow));
}

export const ROMA_AUDIT_RUN_HISTORY_META = {
  persistenceEnabled: true,
  autoSaveEnabled: false,
  listLimit: 20,
  saveApiPath: "/api/v1/platform/testing/safe-audit/save",
  listApiPath: "/api/v1/platform/testing/safe-audit/runs",
} as const;
