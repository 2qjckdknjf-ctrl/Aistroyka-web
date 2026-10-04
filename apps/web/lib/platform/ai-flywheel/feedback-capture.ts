/**
 * AI preference pair capture — inert unless AI_FEEDBACK_CAPTURE_ENABLED.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAiFeedbackCaptureEnabled } from "./flags";

export interface PreferencePairInput {
  aiRequestId?: string | null;
  tenantId: string;
  taskType: string;
  audience?: string;
  inputJson: Record<string, unknown>;
  rejectedJson: Record<string, unknown>;
  chosenJson: Record<string, unknown>;
  source?: string;
}

export interface PreferencePairResult {
  captured: boolean;
  id?: string;
  reason?: string;
}

/** Levenshtein edit distance for trivial-edit detection. */
export function computeEditDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function serializeForDistance(obj: Record<string, unknown>): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

const LOW_VALUE_EDIT_THRESHOLD = 8;

/** Capture preference pair. No-op when flag disabled. */
export async function captureAiPreferencePair(
  supabase: SupabaseClient,
  input: PreferencePairInput
): Promise<PreferencePairResult> {
  if (!isAiFeedbackCaptureEnabled()) {
    return { captured: false, reason: "AI_FEEDBACK_CAPTURE_ENABLED is false" };
  }

  const rejectedStr = serializeForDistance(input.rejectedJson);
  const chosenStr = serializeForDistance(input.chosenJson);
  const editDistance = computeEditDistance(rejectedStr, chosenStr);
  const lowValue = editDistance < LOW_VALUE_EDIT_THRESHOLD;

  const { data, error } = await supabase
    .from("ai_preference_pairs")
    .insert({
      ai_request_id: input.aiRequestId ?? null,
      tenant_id: input.tenantId,
      task_type: input.taskType,
      audience: input.audience ?? "internal",
      input_json: input.inputJson,
      rejected_json: input.rejectedJson,
      chosen_json: input.chosenJson,
      edit_distance: editDistance,
      source: input.source ?? "system",
      low_value: lowValue,
    })
    .select("id")
    .single();

  if (error) {
    return { captured: false, reason: error.message };
  }

  return { captured: true, id: data?.id as string };
}
