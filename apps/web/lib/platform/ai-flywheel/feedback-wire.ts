/**
 * Wire preference-pair capture into existing AI feedback flows.
 * Non-strict: failures never block primary feedback submission.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { captureAiPreferencePair } from "./feedback-capture";

export interface FeedbackPreferencePairPayload {
  aiRequestId?: string | null;
  taskType: string;
  audience?: string;
  inputContext?: Record<string, unknown>;
  rejectedOutput: Record<string, unknown>;
  chosenOutput: Record<string, unknown>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseFeedbackPreferencePair(body: Record<string, unknown>): FeedbackPreferencePairPayload | null {
  const rejected = body.rejectedOutput;
  const chosen = body.chosenOutput;
  const taskType = typeof body.taskType === "string" ? body.taskType.trim() : "";
  if (!taskType || !isRecord(rejected) || !isRecord(chosen)) return null;

  return {
    aiRequestId: typeof body.aiRequestId === "string" ? body.aiRequestId : null,
    taskType,
    audience: typeof body.audience === "string" ? body.audience : "internal",
    inputContext: isRecord(body.inputContext) ? body.inputContext : {},
    rejectedOutput: rejected,
    chosenOutput: chosen,
  };
}

/** Best-effort capture; never throws. */
export async function tryCaptureFeedbackPreferencePair(
  admin: SupabaseClient | null,
  tenantId: string,
  payload: FeedbackPreferencePairPayload | null
): Promise<void> {
  if (!admin || !payload) return;
  try {
    await captureAiPreferencePair(admin, {
      aiRequestId: payload.aiRequestId,
      tenantId,
      taskType: payload.taskType,
      audience: payload.audience,
      inputJson: payload.inputContext ?? {},
      rejectedJson: payload.rejectedOutput,
      chosenJson: payload.chosenOutput,
      source: "manager_edit",
    });
  } catch {
    // Non-strict: never block primary feedback path
  }
}
