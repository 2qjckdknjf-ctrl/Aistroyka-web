/**
 * Explicit UI state machine for job lifecycle.
 * Used to drive polling, button state, and terminal state messages.
 */

import type { AnalysisJob } from "@/lib/types";
import type { ValidationOutcome } from "@/lib/api/validateAnalysisResult";

export type JobUIState =
  | "idle"
  | "ready_to_run"
  | "triggering"
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "network_error"
  | "invalid_result"
  | "timeout";

export interface ClientState {
  triggering?: boolean;
  networkError?: boolean;
}

const ACTIVE_ENGINE_STATUSES = ["pending", "queued", "processing"] as const;

/** Job with optional UI-only timeout flag (processing > 5 min). */
export interface JobWithTimeout extends AnalysisJob {
  timedOut?: boolean;
}

/**
 * Derives UI state from server data + client state.
 * Terminal states: succeeded, failed, network_error, invalid_result, timeout.
 */
export function deriveJobState(
  job: JobWithTimeout | null,
  analysis: unknown,
  validationOutcome: ValidationOutcome | null,
  client: ClientState
): JobUIState {
  if (client.networkError) return "network_error";
  if (client.triggering) return "triggering";

  if (!job) return "ready_to_run";

  const s = job.status;
  if (ACTIVE_ENGINE_STATUSES.includes(s as (typeof ACTIVE_ENGINE_STATUSES)[number])) {
    if (s === "processing" && job.timedOut) return "timeout";
    return s === "processing" ? "processing" : "queued";
  }

  if (s === "failed") return "failed";
  if (s === "completed") {
    if (validationOutcome && !validationOutcome.success) return "invalid_result";
    return "succeeded";
  }

  return "ready_to_run";
}

/** True if polling should run for this state. */
export function isPollingState(state: JobUIState): boolean {
  return state === "queued" || state === "processing";
}

/** True if state is terminal (no further transition from UI). */
export function isTerminalState(state: JobUIState): boolean {
  return (
    state === "succeeded" ||
    state === "failed" ||
    state === "network_error" ||
    state === "invalid_result" ||
    state === "timeout"
  );
}

/** User-facing message for terminal states. */
export const TERMINAL_STATE_MESSAGES: Record<
  "succeeded" | "failed" | "network_error" | "invalid_result" | "timeout",
  string
> = {
  succeeded: "Analysis completed successfully.",
  failed: "Analysis failed. Check the error message above.",
  network_error: "Network error. Please try again.",
  invalid_result: "Analysis returned invalid data. It cannot be displayed.",
  timeout: "Analysis did not complete within 5 minutes. It may still be running on the server.",
};
