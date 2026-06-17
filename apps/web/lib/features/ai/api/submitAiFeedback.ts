/**
 * Client for POST /api/v1/ai/feedback — Phase D + optional flywheel preference fields.
 */

import type { FeedbackCategory } from "@/lib/ai-brain/phase-d/feedback/feedback.types";

export interface SubmitAiFeedbackInput {
  runId: string;
  sourceKind: "human" | "system" | "test";
  feedbackCategory: FeedbackCategory;
  reviewerRole?: string;
  factualityScore?: number;
  usefulnessScore?: number;
  safetyScore?: number;
  roleFitScore?: number;
  completenessScore?: number;
  comments?: string;
  linkedRefs?: Array<{ type: "action" | "output" | "memory" | "run"; ref: string }>;
  /** Optional flywheel fields (top-level on same body) */
  aiRequestId?: string;
  taskType?: string;
  audience?: string;
  inputContext?: Record<string, unknown>;
  rejectedOutput?: Record<string, unknown>;
  chosenOutput?: Record<string, unknown>;
}

export interface SubmitAiFeedbackResult {
  ok: boolean;
  feedbackId?: string;
  error?: string;
  status?: number;
}

export async function submitAiFeedback(
  input: SubmitAiFeedbackInput,
  options?: { getAuthToken?: () => Promise<string | null> }
): Promise<SubmitAiFeedbackResult> {
  const token = options?.getAuthToken ? await options.getAuthToken() : null;
  const res = await fetch("/api/v1/ai/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const body = (await res.json().catch(() => ({}))) as {
    data?: { feedbackId?: string };
    error?: string;
  };

  if (!res.ok) {
    return { ok: false, error: body.error ?? `HTTP ${res.status}`, status: res.status };
  }

  return { ok: true, feedbackId: body.data?.feedbackId };
}
