import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RomaSafeReadonlyAudit } from "./roma-safe-readonly-audit.types";
import {
  assertPayloadSafeForStorage,
  extractBuildShaFromAudit,
  extractEnvironmentFromAudit,
  ROMA_AUDIT_RUN_HISTORY_META,
} from "./roma-run-history.service";
import {
  buildAuditRunRecordDraft,
  redactAuditPayloadForStorage,
} from "./roma-run-history-redaction";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function sampleAudit(): RomaSafeReadonlyAudit {
  return {
    version: "v1",
    auditId: "safe-audit-v1-abc12345",
    createdAt: "2026-07-04T09:00:00.000Z",
    mode: "SAFE_READONLY_AUDIT",
    status: "pass",
    executionEnabled: false,
    evidence: [
      {
        sourceId: "build_stamp",
        label: "Build stamp",
        status: "healthy",
        summary: "ok",
        collectedAt: "2026-07-04T09:00:00.000Z",
        detail: "sha=abcdef1234567890; branch=main",
      },
    ],
    findings: [],
    recommendations: [],
    limitations: [],
    releaseRecommendation: "ready",
    releaseRecommendationLabel: "Ready",
    confidence: "high",
    confidencePercent: 90,
    summary: "Safe readonly audit for Staging.",
    allowedSources: ["build_stamp"],
    forbiddenActions: ["ci_trigger"],
  };
}

describe("ROMA Run History V1", () => {
  it("migration file exists with RLS and roma_audit_runs table", () => {
    const sql = readRelative("supabase/migrations/20260704120000_roma_audit_runs.sql");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.roma_audit_runs/);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/raw_payload_redacted jsonb/);
    expect(sql).not.toMatch(/CREATE POLICY/);
  });

  it("save API requires platform owner write mode", () => {
    const src = readRelative("app/api/v1/platform/testing/safe-audit/save/route.ts");
    expect(src).toMatch(/requirePlatformOwnerApi/);
    expect(src).toMatch(/mode:\s*"write"/);
    expect(src).toMatch(/export async function POST/);
  });

  it("save API does not accept client audit payload", () => {
    const src = readRelative("app/api/v1/platform/testing/safe-audit/save/route.ts");
    expect(src).not.toMatch(/request\.json\s*\(/);
    expect(src).toMatch(/saveAuditRunSnapshot/);
  });

  it("save API uses redaction via service and owner audit log", () => {
    const saveRoute = readRelative("app/api/v1/platform/testing/safe-audit/save/route.ts");
    const service = readRelative("lib/platform-admin/roma-run-history.service.ts");
    expect(saveRoute).toMatch(/roma_audit_run_saved/);
    expect(service).toMatch(/buildAuditRunRecordDraft/);
    expect(service).toMatch(/assertPayloadSafeForStorage/);
  });

  it("list API requires platform owner read mode", () => {
    const src = readRelative("app/api/v1/platform/testing/safe-audit/runs/route.ts");
    expect(src).toMatch(/requirePlatformOwnerApi/);
    expect(src).toMatch(/mode:\s*"read"/);
    expect(src).toMatch(/export async function GET/);
  });

  it("list API returns summaries only without raw payload column", () => {
    const service = readRelative("lib/platform-admin/roma-run-history.service.ts");
    const listColumnsMatch = service.match(/const LIST_COLUMNS\s*=\s*\n?\s*"([^"]+)"/);
    expect(listColumnsMatch?.[1]).toBeDefined();
    expect(listColumnsMatch?.[1]).not.toContain("raw_payload_redacted");
    expect(service).toMatch(/listAuditRunSummaries/);
  });

  it("tenant admin route blocked for audit runs page", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/audit-runs")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/audit-runs")).toBe(false);
  });

  it("no raw token or secret stored in draft payload", () => {
    const audit = sampleAudit();
    audit.findings.push({
      id: "leak",
      severity: "critical",
      title: "Token",
      evidence: "Bearer sk-live-secretkey1234567890",
      sourceId: "derived",
    });
    const draft = buildAuditRunRecordDraft({
      audit,
      createdByUserId: "user-1",
      createdByEmail: "owner@aistroyka.ai",
      environment: "Staging",
    });
    const serialized = JSON.stringify(draft);
    expect(serialized).not.toContain("sk-live");
    expect(serialized).not.toContain("owner@aistroyka.ai");
    expect(draft.raw_payload_redacted.redaction.redacted).toBe(true);
    expect(() => assertPayloadSafeForStorage({ OPENAI_API_KEY: "secret" })).toThrow(/Forbidden/);
  });

  it("extracts environment and build sha from audit", () => {
    const audit = sampleAudit();
    expect(extractEnvironmentFromAudit(audit)).toBe("Staging");
    expect(extractBuildShaFromAudit(audit)).toBe("abcdef1");
  });

  it("history meta disables auto-save", () => {
    expect(ROMA_AUDIT_RUN_HISTORY_META.autoSaveEnabled).toBe(false);
    expect(ROMA_AUDIT_RUN_HISTORY_META.persistenceEnabled).toBe(true);
  });

  it("UI has Save Snapshot and not Run Full Audit", () => {
    const safeAuditUi = readRelative("components/platform-admin/RomaSafeAuditClient.tsx");
    expect(safeAuditUi).toMatch(/Save Snapshot/);
    expect(safeAuditUi).not.toMatch(/Run Full Audit/i);
    expect(safeAuditUi).not.toMatch(/>\s*Execute\s*</i);
    expect(safeAuditUi).not.toMatch(/>\s*Deploy\s*</i);
    expect(safeAuditUi).not.toMatch(/>\s*Fix\s*</i);

    const runsUi = readRelative("components/platform-admin/RomaAuditRunsClient.tsx");
    expect(runsUi).not.toMatch(/>\s*Run\s*</i);
  });

  it("redacted payload strips secrets before storage shape", () => {
    const payload = redactAuditPayloadForStorage(sampleAudit());
    expect(payload.executionEnabled).toBe(false);
    expect(JSON.stringify(payload)).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY=/);
  });
});
