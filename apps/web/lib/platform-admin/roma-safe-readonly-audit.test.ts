import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createSafeReadonlyAuditFromBundle,
  evaluateReadonlyAudit,
  getReadonlyAuditLimitations,
  getSafeReadonlyAuditMeta,
  summarizeReadonlyAudit,
} from "./roma-safe-readonly-audit";
import type { RomaReadonlyAuditEvidenceBundle } from "./roma-safe-readonly-audit.types";
import {
  ROMA_SAFE_READONLY_AUDIT_FORBIDDEN,
  ROMA_SAFE_READONLY_AUDIT_SOURCES,
} from "./roma-safe-readonly-audit.types";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function mockEvidence(
  partial: Partial<RomaReadonlyAuditEvidenceBundle> & Pick<RomaReadonlyAuditEvidenceBundle, "evidence">
): RomaReadonlyAuditEvidenceBundle {
  return {
    collectedAt: "2026-07-04T09:00:00.000Z",
    dashboardGeneratedAt: "2026-07-04T09:00:00.000Z",
    environmentLabel: "Staging",
    probeCoveragePercent: 60,
    releaseDecision: "ready_with_warnings",
    releaseDecisionLabel: "Ready with warnings",
    confidence: "medium",
    confidencePercent: 65,
    engineeringIssueCount: 1,
    dashboardBlockerCount: 0,
    ...partial,
  };
}

describe("ROMA Safe Readonly Audit V1", () => {
  it("meta has execution disabled", () => {
    expect(getSafeReadonlyAuditMeta().executionEnabled).toBe(false);
    expect(getSafeReadonlyAuditMeta().mode).toBe("SAFE_READONLY_AUDIT");
  });

  it("audit uses only allowed sources", () => {
    expect(ROMA_SAFE_READONLY_AUDIT_SOURCES).toEqual(
      expect.arrayContaining([
        "health_endpoint",
        "roma_live_probes",
        "build_stamp",
        "release_env_validation",
        "quality_dashboard_snapshot",
        "engineering_intelligence_snapshot",
      ])
    );
    expect(ROMA_SAFE_READONLY_AUDIT_SOURCES).toHaveLength(10);
    const audit = createSafeReadonlyAuditFromBundle(
      mockEvidence({
        evidence: ROMA_SAFE_READONLY_AUDIT_SOURCES.map((sourceId) => ({
          sourceId,
          label: sourceId,
          status: "healthy",
          summary: "ok",
          collectedAt: "2026-07-04T09:00:00.000Z",
          detail: null,
        })),
        probeCoveragePercent: 80,
        releaseDecision: "ready",
        releaseDecisionLabel: "Ready",
        confidence: "high",
      })
    );
    expect(audit.allowedSources).toEqual(ROMA_SAFE_READONLY_AUDIT_SOURCES);
    expect(audit.evidence.every((e) => ROMA_SAFE_READONLY_AUDIT_SOURCES.includes(e.sourceId))).toBe(true);
  });

  it("audit never mutates production", () => {
    const src = readRelative("lib/platform-admin/roma-safe-readonly-audit.ts");
    expect(src).not.toMatch(/\bdeploy\s*\(/);
    expect(src).not.toMatch(/\bwrangler\s+/);
    expect(src).not.toMatch(/\.insert\s*\(/);
    expect(src).not.toMatch(/\.update\s*\(/);
    expect(src).not.toMatch(/\.delete\s*\(/);
    expect(ROMA_SAFE_READONLY_AUDIT_FORBIDDEN).toContain("production_mutation");
    expect(ROMA_SAFE_READONLY_AUDIT_FORBIDDEN).toContain("db_writes");
  });

  it("audit never triggers CI", () => {
    const src = readRelative("lib/platform-admin/roma-safe-readonly-audit.ts");
    expect(src).not.toMatch(/workflow_dispatch/);
    expect(src).not.toMatch(/github\.actions/i);
    expect(ROMA_SAFE_READONLY_AUDIT_FORBIDDEN).toContain("ci_trigger");
  });

  it("returns UNKNOWN when evidence missing", () => {
    const bundle = mockEvidence({
      probeCoveragePercent: 0,
      confidence: "low",
      releaseDecision: "unknown",
      releaseDecisionLabel: "Unknown",
      evidence: ROMA_SAFE_READONLY_AUDIT_SOURCES.map((sourceId) => ({
        sourceId,
        label: sourceId,
        status: "unknown",
        summary: "unavailable",
        collectedAt: "2026-07-04T09:00:00.000Z",
        detail: null,
      })),
    });
    const result = evaluateReadonlyAudit(bundle);
    expect(result.status).toBe("unknown");
    const audit = createSafeReadonlyAuditFromBundle(bundle);
    expect(audit.confidence).toBe("low");
    expect(audit.status).toBe("unknown");
  });

  it("produces findings from live probe failures", () => {
    const bundle = mockEvidence({
      evidence: [
        {
          sourceId: "health_endpoint",
          label: "Health endpoint",
          status: "unavailable",
          summary: "Health probe failed",
          collectedAt: "2026-07-04T09:00:00.000Z",
          detail: "connection refused",
        },
        {
          sourceId: "quality_dashboard_snapshot",
          label: "Quality dashboard snapshot",
          status: "degraded",
          summary: "Overall health degraded",
          collectedAt: "2026-07-04T09:00:00.000Z",
          detail: null,
        },
        ...ROMA_SAFE_READONLY_AUDIT_SOURCES.filter(
          (id) => id !== "health_endpoint" && id !== "quality_dashboard_snapshot"
        ).map((sourceId) => ({
          sourceId,
          label: sourceId,
          status: "healthy" as const,
          summary: "ok",
          collectedAt: "2026-07-04T09:00:00.000Z",
          detail: null,
        })),
      ],
      releaseDecision: "not_ready",
      releaseDecisionLabel: "Not ready",
    });
    const result = evaluateReadonlyAudit(bundle);
    expect(result.findings.some((f) => f.title.includes("Health endpoint unavailable"))).toBe(true);
    expect(result.findings.some((f) => f.severity === "critical")).toBe(true);
    expect(result.status).toBe("fail");
  });

  it("recommendations are evidence-backed", () => {
    const bundle = mockEvidence({
      evidence: [
        {
          sourceId: "storage_readonly_probe",
          label: "Storage availability (read-only)",
          status: "degraded",
          summary: "media bucket missing",
          collectedAt: "2026-07-04T09:00:00.000Z",
          detail: "media bucket not found",
        },
        ...ROMA_SAFE_READONLY_AUDIT_SOURCES.filter((id) => id !== "storage_readonly_probe").map(
          (sourceId) => ({
            sourceId,
            label: sourceId,
            status: "healthy" as const,
            summary: "ok",
            collectedAt: "2026-07-04T09:00:00.000Z",
            detail: null,
          })
        ),
      ],
    });
    const result = evaluateReadonlyAudit(bundle);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.every((r) => r.evidence.length > 0)).toBe(true);
    expect(result.recommendations.some((r) => r.title.includes("Storage"))).toBe(true);
  });

  it("forbidden actions include deploy fix and DB mutation", () => {
    expect(ROMA_SAFE_READONLY_AUDIT_FORBIDDEN).toEqual(
      expect.arrayContaining(["deploys", "db_writes", "feature_flag_changes", "playwright_execution"])
    );
    const audit = createSafeReadonlyAuditFromBundle(
      mockEvidence({
        evidence: [],
      })
    );
    expect(audit.forbiddenActions).toContain("catalog_test_execution");
    expect(audit.executionEnabled).toBe(false);
  });

  it("summarizeReadonlyAudit includes audit metadata", () => {
    const audit = createSafeReadonlyAuditFromBundle(
      mockEvidence({
        evidence: [],
        releaseDecision: "ready",
        releaseDecisionLabel: "Ready",
      })
    );
    const text = summarizeReadonlyAudit(audit);
    expect(text).toContain(audit.auditId);
    expect(text).toContain("SAFE_READONLY_AUDIT");
  });

  it("limitations are documented", () => {
    const limits = getReadonlyAuditLimitations();
    expect(limits.some((l) => /Playwright|mobile simulators/i.test(l))).toBe(true);
    expect(limits.some((l) => /No CI|deploys|DB writes/i.test(l))).toBe(true);
  });

  it("no run deploy fix buttons in UI", () => {
    const ui = readRelative("components/platform-admin/RomaSafeAuditClient.tsx");
    expect(ui).not.toMatch(/>\s*Run\s*</i);
    expect(ui).not.toMatch(/>\s*Execute\s*</i);
    expect(ui).not.toMatch(/>\s*Deploy\s*</i);
    expect(ui).not.toMatch(/>\s*Fix\s*</i);
  });

  it("route remains platform-owner only", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/safe-audit")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/safe-audit")).toBe(false);
  });

  it("policy evaluation is deterministic", () => {
    const bundle = mockEvidence({
      evidence: ROMA_SAFE_READONLY_AUDIT_SOURCES.map((sourceId) => ({
        sourceId,
        label: sourceId,
        status: "healthy" as const,
        summary: "ok",
        collectedAt: "2026-07-04T09:00:00.000Z",
        detail: null,
      })),
      releaseDecision: "ready",
    });
    const a = evaluateReadonlyAudit(bundle);
    const b = evaluateReadonlyAudit(bundle);
    expect(a).toEqual(b);
  });
});

describe("createSafeReadonlyAudit integration guard", () => {
  it("does not import playwright or child_process", () => {
    const src = readRelative("lib/platform-admin/roma-safe-readonly-audit.ts");
    expect(src).not.toMatch(/playwright/);
    expect(src).not.toMatch(/child_process/);
    expect(src).not.toMatch(/xcodebuild/);
  });
});
