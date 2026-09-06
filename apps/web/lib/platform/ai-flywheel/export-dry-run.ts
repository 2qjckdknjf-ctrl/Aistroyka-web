/**
 * Dataset export dry-run — counts eligible examples only. No real training JSONL unless test flag.
 */

import { filterTenantsWithTrainingConsent, tenantHasTrainingConsent } from "./consent";
import { financeDatasetGuard, type DatasetExample } from "./finance-dataset-guard";
import { scrubJsonStrings } from "./pii-scrub";
import { verifyScrubbedJson } from "./pii-scrub-verifier";
import { isAiDatasetExportEnabled } from "./flags";

export interface DryRunCandidate {
  id: string;
  tenantId: string;
  audience: DatasetExample["audience"];
  payload: Record<string, unknown>;
}

export interface DryRunReport {
  enabled: boolean;
  totalCandidates: number;
  consentEligible: number;
  scrubPassed: number;
  financeBlocked: number;
  droppedScrubFailures: number;
  finalEligible: number;
  blockedFinanceIds: string[];
  droppedScrubIds: string[];
  consentDeniedTenantIds: string[];
}

export interface DryRunInput {
  tenants: Array<{ id: string; ai_training_consent?: boolean | null }>;
  candidates: DryRunCandidate[];
}

/** Process candidates through consent → scrub → verify → finance guard. */
export function runDatasetExportDryRun(input: DryRunInput): DryRunReport {
  const enabled = isAiDatasetExportEnabled();
  const consentEligibleTenants = filterTenantsWithTrainingConsent(input.tenants);
  const consentTenantIds = new Set(consentEligibleTenants.map((t) => t.id));
  const consentDeniedTenantIds = input.tenants
    .filter((t) => !tenantHasTrainingConsent(t.ai_training_consent))
    .map((t) => t.id);

  let consentEligible = 0;
  let scrubPassed = 0;
  const scrubbedExamples: DatasetExample[] = [];
  const droppedScrubIds: string[] = [];

  for (const c of input.candidates) {
    if (!consentTenantIds.has(c.tenantId)) continue;
    consentEligible++;

    const scrubbed = scrubJsonStrings(c.payload);
    const verify = verifyScrubbedJson(scrubbed.value);
    if (!verify.passed) {
      droppedScrubIds.push(c.id);
      continue;
    }
    scrubPassed++;

    const text =
      typeof scrubbed.value === "object" && scrubbed.value !== null
        ? JSON.stringify(scrubbed.value)
        : String(scrubbed.value);

    scrubbedExamples.push({
      id: c.id,
      audience: c.audience,
      text,
      labels: { audience: c.audience },
    });
  }

  const financeReport = financeDatasetGuard(scrubbedExamples);
  const finalEligible = scrubbedExamples.length - financeReport.blockedCount;

  return {
    enabled,
    totalCandidates: input.candidates.length,
    consentEligible,
    scrubPassed,
    financeBlocked: financeReport.blockedCount,
    droppedScrubFailures: droppedScrubIds.length,
    finalEligible,
    blockedFinanceIds: financeReport.blockedIds,
    droppedScrubIds,
    consentDeniedTenantIds,
  };
}

/** Format report for CLI output — no raw tenant data. */
export function formatDryRunReport(report: DryRunReport): string {
  return [
    `AI dataset export dry-run`,
    `  export flag enabled: ${report.enabled}`,
    `  total candidates: ${report.totalCandidates}`,
    `  consent eligible: ${report.consentEligible}`,
    `  scrub passed: ${report.scrubPassed}`,
    `  scrub failures dropped: ${report.droppedScrubFailures}`,
    `  finance blocked: ${report.financeBlocked}`,
    `  final eligible: ${report.finalEligible}`,
    `  consent denied tenants: ${report.consentDeniedTenantIds.length}`,
  ].join("\n");
}
