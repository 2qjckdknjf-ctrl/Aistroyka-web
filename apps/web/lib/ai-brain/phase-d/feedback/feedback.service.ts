/**
 * AI Brain Phase D — Feedback service.
 * Validates and submits structured feedback linked to AI runs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getRunRecordIdByRunId } from "../run/run.repository";
import { createFeedbackRecord } from "./feedback.repository";
import { logPhaseDFeedbackRecorded } from "../telemetry/phase-d-telemetry";
import type {
  CreateFeedbackInput,
  FeedbackCategory,
  FeedbackSourceKind,
  LinkedRef,
} from "./feedback.types";
import { FEEDBACK_CATEGORIES, FEEDBACK_SOURCE_KINDS } from "./feedback.types";

export type SubmitFeedbackResult =
  | { success: true; feedbackId: string }
  | { success: false; error: string };

export function validateFeedbackCategory(v: unknown): v is FeedbackCategory {
  return typeof v === "string" && FEEDBACK_CATEGORIES.includes(v as FeedbackCategory);
}

export function validateSourceKind(v: unknown): v is FeedbackSourceKind {
  return typeof v === "string" && FEEDBACK_SOURCE_KINDS.includes(v as FeedbackSourceKind);
}

export function validateScore(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0 || n > 5) return null;
  return Math.round(n);
}

export function validateLinkedRefs(v: unknown): LinkedRef[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is LinkedRef => {
    if (typeof x !== "object" || x == null) return false;
    const o = x as Record<string, unknown>;
    return (
      (o.type === "action" || o.type === "output" || o.type === "memory" || o.type === "run") &&
      typeof o.ref === "string"
    );
  });
}

export async function submitFeedback(
  supabase: SupabaseClient,
  input: CreateFeedbackInput
): Promise<SubmitFeedbackResult> {
  if (!input.runId?.trim()) {
    return { success: false, error: "runId required" };
  }
  if (!input.tenantId?.trim()) {
    return { success: false, error: "tenantId required" };
  }
  if (!validateSourceKind(input.sourceKind)) {
    return { success: false, error: `sourceKind must be one of: ${FEEDBACK_SOURCE_KINDS.join(", ")}` };
  }
  if (!validateFeedbackCategory(input.feedbackCategory)) {
    return { success: false, error: `feedbackCategory must be one of: ${FEEDBACK_CATEGORIES.join(", ")}` };
  }

  const runRecordId = await getRunRecordIdByRunId(supabase, input.runId.trim());
  if (!runRecordId) {
    return { success: false, error: "Run record not found; feedback requires a recorded run" };
  }

  const feedback = await createFeedbackRecord(supabase, runRecordId, {
    ...input,
    runId: input.runId.trim(),
    tenantId: input.tenantId.trim(),
    linkedRefs: validateLinkedRefs(input.linkedRefs),
  });

  if (!feedback) {
    return { success: false, error: "Failed to store feedback" };
  }
  logPhaseDFeedbackRecorded({
    feedbackId: feedback.id,
    runId: input.runId,
    tenantId: input.tenantId,
    sourceKind: input.sourceKind,
    feedbackCategory: input.feedbackCategory,
  });
  return { success: true, feedbackId: feedback.id };
}
