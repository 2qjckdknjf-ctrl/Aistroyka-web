"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function LowConfidenceNotice({
  onSuggestFollowUp,
}: {
  /** Called with template text to insert into Copilot textarea (e.g. setCopilotQuestion). */
  onSuggestFollowUp?: (text: string) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded border border-aistroyka-warning/30 bg-aistroyka-warning/5 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded bg-aistroyka-warning/20 px-2 py-0.5 text-xs font-medium text-aistroyka-warning"
          role="status"
        >
          {tDetail("limitedContext")}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          aria-expanded={expanded}
          aria-controls="low-confidence-details"
        >
          {expanded ? tDetail("hide") : tDetail("whyThisHappened")}
        </button>
        {onSuggestFollowUp && (
          <button
            type="button"
            onClick={() => onSuggestFollowUp(tDetail("followUpTemplate"))}
            className="input-field-sm px-2 py-1 text-xs font-medium text-aistroyka-text-secondary focus:ring-offset-2"
          >
            {tDetail("suggestFollowUpQuestion")}
          </button>
        )}
      </div>
      {expanded && (
        <p
          id="low-confidence-details"
          className="mt-2 text-aistroyka-text-secondary"
          role="region"
          aria-label={tDetail("explanation")}
        >
          {tDetail("limitedContextReason")}
        </p>
      )}
    </div>
  );
}
