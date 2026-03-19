/**
 * Step 17 — Deterministic incident hint shaping for operator diagnostics.
 * Used by GET /api/v1/admin/ops/diagnostics to suggest likely incident types.
 */

export interface IncidentHintsInput {
  /** AI error rate in window (0–1). Hint when >= 0.2. */
  errorRateWindow: number | null;
  /** Error counts by provider (e.g. { gemini: 5, openai: 1 }). */
  errorsByProvider: Record<string, number>;
  /** Failed job count. */
  failedJobCount: number;
  /** Dominant job type (most failures). */
  dominantJobType: string | null;
  /** Stuck upload count. */
  uploadsStuck: number;
}

/**
 * Returns operator-facing incident hints based on current metrics.
 * Empty array when nothing suggests an incident; otherwise runbook-oriented strings.
 */
export function buildIncidentHints(input: IncidentHintsInput): string[] {
  const hints: string[] = [];
  if (input.errorRateWindow != null && input.errorRateWindow >= 0.2) {
    hints.push(
      "ai_runtime_failure_cluster: high AI error rate — runbook AI provider degradation / AI runtime failure cluster."
    );
  }
  const providerEntries = Object.entries(input.errorsByProvider);
  if (providerEntries.length > 0) {
    const top = providerEntries.sort((a, b) => b[1] - a[1])[0];
    hints.push(
      `ai_provider: errors_by_provider suggests ${top[0]} — check provider status if isolated.`
    );
  }
  if (input.failedJobCount > 0) {
    hints.push(
      `cron_job_failure: ${input.failedJobCount} failed job(s)${input.dominantJobType ? `; dominant type: ${input.dominantJobType}` : ""} — runbook Job/cron failures.`
    );
  }
  if (input.uploadsStuck > 0) {
    hints.push("upload_media: uploads_stuck > 0 — runbook Upload/media incident.");
  }
  return hints;
}
