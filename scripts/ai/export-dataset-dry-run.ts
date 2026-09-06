#!/usr/bin/env bun
/**
 * Dataset export dry-run — counts eligible examples only.
 * Never writes training JSONL unless --write-test-output is provided (test fixtures only).
 *
 * Usage:
 *   bun scripts/ai/export-dataset-dry-run.ts
 *   bun scripts/ai/export-dataset-dry-run.ts --write-test-output /tmp/flywheel-test.jsonl
 */

import {
  runDatasetExportDryRun,
  formatDryRunReport,
} from "../../apps/web/lib/platform/ai-flywheel/export-dry-run";

/** Built-in test corpus — no live tenant data. */
const FIXTURE_TENANTS = [
  { id: "tenant-no-consent", ai_training_consent: false },
  { id: "tenant-consent", ai_training_consent: true },
];

const FIXTURE_CANDIDATES = [
  {
    id: "c1",
    tenantId: "tenant-no-consent",
    audience: "internal" as const,
    payload: { prompt: "Schedule review for project A" },
  },
  {
    id: "c2",
    tenantId: "tenant-consent",
    audience: "owner" as const,
    payload: { prompt: "Estimate for approval: kitchen renovation €12,000" },
  },
  {
    id: "c3",
    tenantId: "tenant-consent",
    audience: "owner" as const,
    payload: { prompt: "Contact user@example.com for margin review internal cost €5000" },
  },
  {
    id: "c4",
    tenantId: "tenant-consent",
    audience: "internal" as const,
    payload: { note: "Internal margin risk 12% on subcontractor cost" },
  },
];

async function main(): Promise<void> {
  const writeIdx = process.argv.indexOf("--write-test-output");
  const report = runDatasetExportDryRun({
    tenants: FIXTURE_TENANTS,
    candidates: FIXTURE_CANDIDATES,
  });

  console.log(formatDryRunReport(report));

  if (writeIdx >= 0) {
    const outPath = process.argv[writeIdx + 1];
    if (!outPath) {
      process.stderr.write("--write-test-output requires a path\n");
      process.exit(1);
    }
    // Only write scrubbed fixture lines that passed all gates
    const lines: string[] = [];
    for (const c of FIXTURE_CANDIDATES) {
      if (report.consentDeniedTenantIds.includes(c.tenantId)) continue;
      if (report.droppedScrubIds.includes(c.id)) continue;
      if (report.blockedFinanceIds.includes(c.id)) continue;
      lines.push(JSON.stringify({ id: c.id, audience: c.audience, fixture: true }));
    }
    await Bun.write(outPath, lines.join("\n") + (lines.length ? "\n" : ""));
    process.stderr.write(`Wrote ${lines.length} test fixture line(s) to ${outPath}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
