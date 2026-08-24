#!/usr/bin/env node
/**
 * Dry-run manifest for owner evidence visibility backfill.
 * Default: reveal nothing. Use --dry-run to list candidates only.
 *
 * Usage:
 *   node scripts/pilot/owner-evidence-backfill-manifest.mjs --dry-run
 */

const DRY_RUN = process.argv.includes("--dry-run");

console.log(
  JSON.stringify(
    {
      mode: DRY_RUN ? "dry_run_manifest" : "blocked_requires_dry_run_flag",
      default_action: "reveal_nothing",
      eligible_criteria: [
        "report.status = approved",
        "visual_evidence_records.internal_only = false",
        "visual_evidence_records.retention_state = active",
        "report.project_id = visual_evidence_records.project_id",
      ],
      excluded: ["internal_only", "rejected reports", "archived retention", "cross-project mismatch"],
      remote_apply: "NOT_AUTHORIZED — owner gate required",
      rows_to_update: DRY_RUN ? "query_only_not_executed" : 0,
    },
    null,
    2
  )
);

if (!DRY_RUN) {
  process.exitCode = 1;
}
