/**
 * Expert Review Queue guards — PII scrub + finance for queue candidates.
 */

import { ownerAudienceDatasetGuard, type DatasetAudience } from "../finance-dataset-guard";
import { scrubJsonStrings } from "../pii-scrub";
import { verifyScrubbedJson } from "../pii-scrub-verifier";
import type { ExpertReviewQueueCandidate } from "./expert-review-queue.types";

export interface QueueGuardReject {
  kind: "pii" | "finance";
  sourceId: string;
}

function jsonText(obj: Record<string, unknown>): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

/** Scrub and validate queue candidate payloads. */
export function guardQueueCandidate(
  candidate: ExpertReviewQueueCandidate
): { payload: { inputJson: Record<string, unknown>; modelOutputJson: Record<string, unknown> } } | { reject: QueueGuardReject } {
  const scrubbedInput = scrubJsonStrings(candidate.inputJson);
  if (!verifyScrubbedJson(scrubbedInput.value).passed) {
    return { reject: { kind: "pii", sourceId: candidate.sourceId } };
  }

  const scrubbedOutput = scrubJsonStrings(candidate.modelOutputJson);
  if (!verifyScrubbedJson(scrubbedOutput.value).passed) {
    return { reject: { kind: "pii", sourceId: candidate.sourceId } };
  }

  const audience = candidate.audience as DatasetAudience;
  const combined = `${jsonText(scrubbedInput.value as Record<string, unknown>)} ${jsonText(scrubbedOutput.value as Record<string, unknown>)}`;
  const finance = ownerAudienceDatasetGuard({
    id: candidate.sourceId,
    audience,
    text: combined,
    labels: { audience },
  });

  if (!finance.passed) {
    return { reject: { kind: "finance", sourceId: candidate.sourceId } };
  }

  return {
    payload: {
      inputJson: scrubbedInput.value as Record<string, unknown>,
      modelOutputJson: scrubbedOutput.value as Record<string, unknown>,
    },
  };
}
