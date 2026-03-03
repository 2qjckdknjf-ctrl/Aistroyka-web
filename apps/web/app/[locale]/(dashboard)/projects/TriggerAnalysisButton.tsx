"use client";

import { useState } from "react";
import { acquireTriggerLock, releaseTriggerLock } from "@/lib/triggerLock";
import {
  normalizeApiError,
  networkErrorToApiError,
  type ApiErrorResponse,
} from "@/lib/api/errorShape";
import type { JobUIState } from "@/lib/jobStateMachine";

export function TriggerAnalysisButton({
  projectId,
  mediaId,
  disabled,
  state,
  onTriggerStart,
  onTriggerSuccess,
  onError,
}: {
  projectId: string;
  mediaId: string;
  disabled: boolean;
  state: JobUIState;
  onTriggerStart: () => void;
  onTriggerSuccess: () => void;
  onError: () => void;
}) {
  const [apiError, setApiError] = useState<ApiErrorResponse | null>(null);

  async function handleClick() {
    if (disabled) return;
    if (!acquireTriggerLock(projectId, mediaId)) return;

    setApiError(null);
    onTriggerStart();

    try {
      const res = await fetch(
        `/api/projects/${projectId}/media/${mediaId}/trigger`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { jobId?: string };
        error?: string;
      };

      if (!res.ok) {
        setApiError(normalizeApiError(res, data));
        onError();
        return;
      }
      if (data.success === false && data.error) {
        setApiError(normalizeApiError(res, data));
        onError();
        return;
      }
      onTriggerSuccess();
    } catch (_e) {
      setApiError(networkErrorToApiError());
      onError();
    } finally {
      releaseTriggerLock(projectId, mediaId);
    }
  }

  const buttonLabel =
    state === "triggering"
      ? "Triggering…"
      : state === "queued" || state === "processing"
        ? "Analysis running…"
        : "Run analysis";

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="min-h-[36px] rounded-aistroyka-lg border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-sm disabled:opacity-50"
      >
        {buttonLabel}
      </button>
      {apiError && (
        <span className="ml-2 text-sm text-aistroyka-error" role="alert">
          {apiError.error.message}
        </span>
      )}
    </div>
  );
}
