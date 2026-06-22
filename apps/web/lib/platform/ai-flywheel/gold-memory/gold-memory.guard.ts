/**
 * Gold Memory guards — consent, PII, finance for builder pipeline.
 */

import { tenantHasTrainingConsent } from "../consent";
import { ownerAudienceDatasetGuard, type DatasetAudience } from "../finance-dataset-guard";
import { scrubJsonStrings } from "../pii-scrub";
import { verifyScrubbedJson } from "../pii-scrub-verifier";
import type { GoldMemoryCandidate } from "./gold-memory.types";

export interface GuardRejectReason {
  kind: "consent" | "pii" | "finance";
  sourceId: string;
}

export interface GuardedGoldPayload {
  scrubbedInput: Record<string, unknown>;
  scrubbedGoldOutput: Record<string, unknown>;
  financeGuardPassed: boolean;
  consentSnapshot: boolean;
}

function jsonToGuardText(obj: Record<string, unknown>): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

/** Apply consent → scrub → verify → finance guard. Returns null if rejected. */
export function guardGoldMemoryCandidate(
  candidate: GoldMemoryCandidate
): { payload: GuardedGoldPayload } | { reject: GuardRejectReason } {
  if (!tenantHasTrainingConsent(candidate.consent)) {
    return { reject: { kind: "consent", sourceId: candidate.sourceId } };
  }

  const scrubbedInput = scrubJsonStrings(candidate.inputJson);
  const inputVerify = verifyScrubbedJson(scrubbedInput.value);
  if (!inputVerify.passed) {
    return { reject: { kind: "pii", sourceId: candidate.sourceId } };
  }

  const scrubbedOutput = scrubJsonStrings(candidate.goldOutputJson);
  const outputVerify = verifyScrubbedJson(scrubbedOutput.value);
  if (!outputVerify.passed) {
    return { reject: { kind: "pii", sourceId: candidate.sourceId } };
  }

  const audience = candidate.audience as DatasetAudience;
  const combinedText = `${jsonToGuardText(scrubbedInput.value as Record<string, unknown>)} ${jsonToGuardText(scrubbedOutput.value as Record<string, unknown>)}`;
  const financeResult = ownerAudienceDatasetGuard({
    id: candidate.sourceId,
    audience,
    text: combinedText,
    labels: { audience },
  });

  if (!financeResult.passed) {
    return { reject: { kind: "finance", sourceId: candidate.sourceId } };
  }

  return {
    payload: {
      scrubbedInput: scrubbedInput.value as Record<string, unknown>,
      scrubbedGoldOutput: scrubbedOutput.value as Record<string, unknown>,
      financeGuardPassed: true,
      consentSnapshot: true,
    },
  };
}
