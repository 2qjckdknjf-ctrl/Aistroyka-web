"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { JobStatusBadge } from "./JobStatusBadge";
import { TriggerAnalysisButton } from "./TriggerAnalysisButton";
import {
  deriveJobState,
  isTerminalState,
  TERMINAL_STATE_MESSAGES,
} from "@/lib/jobStateMachine";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import {
  computeGovernance,
  getGovernanceLabelDisplay,
  type PreviousSnapshot,
} from "@/lib/intelligence/governance";
import type { MediaWithJob } from "@/lib/types";
import type { ValidationOutcome } from "@/lib/api/validateAnalysisResult";

export function MediaAnalysisRow({
  projectId,
  mediaWithJob,
  previousAnalysis = null,
  onResumePolling,
}: {
  projectId: string;
  mediaWithJob: MediaWithJob;
  previousAnalysis?: PreviousSnapshot | null;
  onResumePolling?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("projectDetail");
  const locale = useLocale();
  const { media, job, analysis } = mediaWithJob;
  const [triggering, setTriggering] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const validationOutcome: ValidationOutcome | null =
    analysis != null
      ? validateAnalysisResult({
          stage: analysis.stage ?? "",
          completion_percent: analysis.completion_percent,
          risk_level: analysis.risk_level,
          detected_issues: analysis.detected_issues ?? [],
          recommendations: analysis.recommendations ?? [],
        })
      : null;

  const state = deriveJobState(
    job,
    analysis,
    validationOutcome,
    { triggering, networkError }
  );

  const isActive = state === "queued" || state === "processing" || state === "triggering";
  const showTerminalMessage = isTerminalState(state);
  const terminalMessage =
    showTerminalMessage && state in TERMINAL_STATE_MESSAGES
      ? TERMINAL_STATE_MESSAGES[state as keyof typeof TERMINAL_STATE_MESSAGES]
      : null;

  return (
    <li className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-aistroyka-text-secondary">{media.file_url}</p>
          <p className="text-xs text-aistroyka-text-tertiary">
            {t("uploadedAt")} {new Date(media.uploaded_at).toLocaleString(locale)}
          </p>
        </div>
        {job && <JobStatusBadge status={job.status} />}
      </div>

      <TriggerAnalysisButton
        projectId={projectId}
        mediaId={media.id}
        disabled={isActive}
        state={state}
        onTriggerStart={() => setTriggering(true)}
        onTriggerSuccess={() => {
          setTriggering(false);
          setNetworkError(false);
          router.refresh();
        }}
        onError={() => {
          setTriggering(false);
          setNetworkError(true);
        }}
      />

      {job?.error_message && (
        <p className="mt-2 text-sm text-aistroyka-error" role="alert">
          Error: {job.error_message}
        </p>
      )}

      {terminalMessage && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p
            className={
              state === "failed" || state === "network_error"
                ? "text-sm text-aistroyka-error"
                : state === "invalid_result"
                  ? "text-sm text-aistroyka-warning"
                  : state === "timeout"
                    ? "text-sm text-aistroyka-warning"
                    : "text-sm text-aistroyka-text-secondary"
            }
            role="status"
          >
            {terminalMessage}
          </p>
          {state === "timeout" && onResumePolling && (
            <button
              type="button"
              onClick={() => onResumePolling()}
              className="min-h-[36px] rounded-lg border border-aistroyka-warning bg-aistroyka-surface px-3 py-2 text-sm text-aistroyka-warning hover:bg-aistroyka-warning/20"
            >
              Resume polling
            </button>
          )}
        </div>
      )}

      {analysis && state === "succeeded" && validationOutcome?.success && (() => {
        const gov = computeGovernance(
          { ...validationOutcome.data, created_at: analysis.created_at },
          previousAnalysis
        );
        const labelDisplay = getGovernanceLabelDisplay(gov.label);
        const badgeClass =
          gov.label === "valid"
            ? "bg-aistroyka-success/20 text-aistroyka-success"
            : gov.label === "suspicious"
              ? "bg-aistroyka-warning/20 text-aistroyka-warning"
              : "bg-aistroyka-error/20 text-aistroyka-error";
        return (
          <div className="mt-3">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                title={`Confidence: ${gov.confidenceScore}`}
              >
                {labelDisplay}
              </span>
              <span className="text-xs text-aistroyka-text-tertiary">
                Confidence: {gov.confidenceScore}
              </span>
            </div>
            <p className="mb-2 text-xs font-medium text-aistroyka-text-tertiary">Result (JSON)</p>
            <pre className="min-w-0 overflow-x-auto rounded-lg bg-aistroyka-surface-muted p-4 text-xs text-aistroyka-text-primary">
              {JSON.stringify(validationOutcome.data, null, 2)}
            </pre>
          </div>
        );
      })()}

      {analysis && state === "invalid_result" && validationOutcome && !validationOutcome.success && (
        <div className="mt-4 rounded-lg border border-aistroyka-warning/50 bg-aistroyka-warning/20 p-4 text-sm">
          <p className="font-medium text-aistroyka-warning">Invalid result structure</p>
          <p className="mt-1 text-aistroyka-warning">{validationOutcome.error}</p>
          {validationOutcome.details && (
            <p className="mt-1 font-mono text-xs text-aistroyka-warning">
              {validationOutcome.details}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
