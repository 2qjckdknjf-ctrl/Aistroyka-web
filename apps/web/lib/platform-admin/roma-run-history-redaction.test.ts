import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RomaSafeReadonlyAudit } from "./roma-safe-readonly-audit.types";
import {
  buildAuditRunRecordDraft,
  buildAuditRunSummaries,
  compareAuditRunFindingTitles,
  computeRetentionUntil,
  hashOwnerEmail,
  redactAuditPayloadForStorage,
} from "./roma-run-history-redaction";

const ROOT = process.cwd();

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function sampleAudit(overrides?: Partial<RomaSafeReadonlyAudit>): RomaSafeReadonlyAudit {
  return {
    version: "v1",
    auditId: "safe-audit-v1-abc12345",
    createdAt: "2026-07-04T09:00:00.000Z",
    mode: "SAFE_READONLY_AUDIT",
    status: "degraded",
    executionEnabled: false,
    evidence: [
      {
        sourceId: "health_endpoint",
        label: "Health endpoint",
        status: "healthy",
        summary: "HTTP 200; ok=true",
        collectedAt: "2026-07-04T09:00:00.000Z",
        detail: null,
      },
    ],
    findings: [
      {
        id: "finding-storage",
        severity: "warning",
        title: "Storage degraded",
        evidence: "Contact ops@aistroyka.ai for details",
        sourceId: "storage_readonly_probe",
      },
    ],
    recommendations: [],
    limitations: ["No persistence in V1"],
    releaseRecommendation: "ready_with_warnings",
    releaseRecommendationLabel: "Ready with warnings",
    confidence: "medium",
    confidencePercent: 65,
    summary: "Safe readonly audit for Staging.",
    allowedSources: ["health_endpoint"],
    forbiddenActions: ["ci_trigger"],
    ...overrides,
  };
}

describe("ROMA Run History redaction model", () => {
  it("redaction module has no DB or persistence writes", () => {
    const src = readRelative("lib/platform-admin/roma-run-history-redaction.ts");
    expect(src).not.toMatch(/\.from\s*\(\s*["']roma_audit_runs/);
    expect(src).not.toMatch(/supabase.*\.insert\s*\(/);
    expect(src).not.toMatch(/getAdminClient/);
  });

  it("redacts emails and tokens from audit payload", () => {
    const payload = redactAuditPayloadForStorage(
      sampleAudit({
        findings: [
          {
            id: "f1",
            severity: "critical",
            title: "Leak",
            evidence: "Bearer sk-live-abcdefghijklmnop and owner@test.com",
            sourceId: "derived",
          },
        ],
      })
    );
    expect(payload.findings[0]?.evidence).not.toContain("owner@test.com");
    expect(payload.findings[0]?.evidence).not.toContain("sk-live");
    expect(payload.findings[0]?.evidence).toContain("[REDACTED]");
    expect(payload.redaction.redacted).toBe(true);
    expect(payload.redaction.kinds).toEqual(expect.arrayContaining(["email", "bearer_token"]));
  });

  it("hashes owner email without storing raw email in draft record", () => {
    const draft = buildAuditRunRecordDraft({
      audit: sampleAudit(),
      createdByUserId: "user-uuid-1",
      createdByEmail: "owner@aistroyka.ai",
      environment: "Staging",
      buildSha: "abc1234",
      createdAt: new Date("2026-07-04T09:00:00.000Z"),
    });
    expect(draft.created_by_email_hash).toBe(hashOwnerEmail("owner@aistroyka.ai"));
    expect(draft.created_by_email_hash).not.toContain("@");
    expect(JSON.stringify(draft)).not.toContain("owner@aistroyka.ai");
  });

  it("builds deterministic summaries from audit", () => {
    const summaries = buildAuditRunSummaries(sampleAudit());
    expect(summaries.critical_count).toBe(0);
    expect(summaries.warning_count).toBe(1);
    expect(summaries.evidence_summary).toContain("health_endpoint:healthy");
    expect(summaries.findings_summary).toContain("warning:Storage degraded");
  });

  it("computes retention window", () => {
    const until = computeRetentionUntil(new Date("2026-07-04T00:00:00.000Z"), 90);
    expect(until).toBe("2026-10-02T00:00:00.000Z");
  });

  it("compare model identifies new and resolved findings", () => {
    const result = compareAuditRunFindingTitles(
      ["Storage degraded", "AI not configured"],
      ["Storage degraded", "DB latency high"]
    );
    expect(result.newFindings).toEqual(["DB latency high"]);
    expect(result.resolvedFindings).toEqual(["AI not configured"]);
  });

  it("types file defines future schema without migration", () => {
    const typesSrc = readRelative("lib/platform-admin/roma-run-history.types.ts");
    expect(typesSrc).toMatch(/RomaAuditRunRecord/);
    expect(typesSrc).not.toMatch(/CREATE TABLE/);
    expect(typesSrc).not.toMatch(/apply_migration/);
  });
});
