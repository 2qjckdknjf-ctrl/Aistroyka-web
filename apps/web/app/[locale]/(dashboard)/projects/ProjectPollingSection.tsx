"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { JobListPolling } from "./JobListPolling";
import { MediaAnalysisRow } from "./MediaAnalysisRow";
import { AiConfigHint } from "./AiConfigHint";
import type { MediaWithJob } from "@/lib/types";

/**
 * Wraps polling and media list. Holds "resume polling" state for timeout rows
 * so user can re-enable polling when a job has been in timeout (processing > 5 min).
 */
export function ProjectPollingSection({
  projectId,
  hasActiveJobs,
  hasTimedOutJobs,
  mediaWithJobs,
  previousByMediaId = {},
}: {
  projectId: string;
  hasActiveJobs: boolean;
  hasTimedOutJobs: boolean;
  mediaWithJobs: MediaWithJob[];
  previousByMediaId?: Record<
    string,
    { completion_percent: number; created_at: string }
  >;
}) {
  const t = useTranslations("projectDetail");
  const [forcePolling, setForcePolling] = useState(false);

  useEffect(() => {
    if (!hasActiveJobs && !hasTimedOutJobs) setForcePolling(false);
  }, [hasActiveJobs, hasTimedOutJobs]);

  const shouldPoll = hasActiveJobs || forcePolling;

  return (
    <JobListPolling projectId={projectId} hasActiveJobs={shouldPoll}>
      <AiConfigHint showWhenActive={shouldPoll} />
      {mediaWithJobs.length > 0 ? (
        <ul className="space-y-4">
          {mediaWithJobs.map((mw) => (
            <MediaAnalysisRow
              key={mw.media.id}
              projectId={projectId}
              mediaWithJob={mw}
              previousAnalysis={previousByMediaId[mw.media.id] ?? null}
              onResumePolling={() => setForcePolling(true)}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-aistroyka-lg border border-dashed border-aistroyka-border-subtle bg-aistroyka-surface-raised/80 px-6 py-8 text-center">
          <p className="text-sm text-aistroyka-text-secondary">{t("noMediaYet")}</p>
        </div>
      )}
    </JobListPolling>
  );
}
