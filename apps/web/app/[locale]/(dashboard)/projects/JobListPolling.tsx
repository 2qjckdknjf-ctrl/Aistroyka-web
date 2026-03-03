"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBackoffMs } from "@/lib/pollingBackoff";

const POLL_FAILURES_BEFORE_NETWORK_ERROR = 5;

/**
 * When there are active jobs, poll via API with exponential backoff.
 * Start 2s, double each attempt (2→4→8→16), cap 20s. Reset to 2s on success.
 * Stop on: succeeded/failed/invalid_result/timeout (hasActiveJobs false) or after 5 poll failures (network_error).
 */
export function JobListPolling({
  projectId,
  hasActiveJobs,
  children,
}: {
  projectId: string;
  hasActiveJobs: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pollingNetworkError, setPollingNetworkError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const failureCountRef = useRef(0);

  useEffect(() => {
    if (!hasActiveJobs) {
      setPollingNetworkError(false);
      failureCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const abortController = new AbortController();
    setPollingNetworkError(false);
    attemptRef.current = 0;
    failureCountRef.current = 0;

    function schedule() {
      const delay = getBackoffMs(attemptRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        runPoll();
      }, delay);
    }

    async function runPoll() {
      if (abortController.signal.aborted) return;
      try {
        // Kick processing so the web app can run the AI engine without a separate worker
        fetch("/api/analysis/process", { method: "POST", signal: abortController.signal }).catch(() => {});
        const res = await fetch(`/api/projects/${projectId}/poll-status`, { signal: abortController.signal });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          data?: { hasActiveJobs?: boolean };
        };
        if (res.ok && data.ok !== false && data.data?.hasActiveJobs !== undefined) {
          failureCountRef.current = 0;
          attemptRef.current = 0;
          router.refresh();
          schedule();
        } else {
          if (abortController.signal.aborted) return;
          failureCountRef.current++;
          if (failureCountRef.current >= POLL_FAILURES_BEFORE_NETWORK_ERROR) {
            setPollingNetworkError(true);
          } else {
            attemptRef.current++;
            schedule();
          }
        }
      } catch (_e) {
        if (abortController.signal.aborted) return;
        failureCountRef.current++;
        if (failureCountRef.current >= POLL_FAILURES_BEFORE_NETWORK_ERROR) {
          setPollingNetworkError(true);
        } else {
          attemptRef.current++;
          schedule();
        }
      }
    }

    schedule();
    return () => {
      abortController.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hasActiveJobs, projectId, router, retryTrigger]);

  return (
    <>
      {pollingNetworkError && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="text-sm text-aistroyka-error" role="alert">
            Polling unavailable after several failures.
          </p>
          <button
            type="button"
            onClick={() => {
              setPollingNetworkError(false);
              setRetryTrigger((t) => t + 1);
            }}
            className="min-h-[36px] rounded-aistroyka-lg border border-aistroyka-error bg-aistroyka-surface px-3 py-2 text-sm text-aistroyka-error hover:bg-aistroyka-error/10"
          >
            Retry
          </button>
        </div>
      )}
      {children}
    </>
  );
}
