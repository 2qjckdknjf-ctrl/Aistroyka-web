"use client";

import { useState } from "react";

const WHY_TEXT =
  "AI had limited project context for this answer. Consider clarifying your question or adding more data to the project.";

const FOLLOW_UP_TEMPLATE = "Can you elaborate on the main risks and suggested next steps?";

export function LowConfidenceNotice({
  onSuggestFollowUp,
}: {
  /** Called with template text to insert into Copilot textarea (e.g. setCopilotQuestion). */
  onSuggestFollowUp?: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded border border-aistroyka-warning/30 bg-aistroyka-warning/5 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded bg-aistroyka-warning/20 px-2 py-0.5 text-xs font-medium text-aistroyka-warning"
          role="status"
        >
          Limited context
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          aria-expanded={expanded}
          aria-controls="low-confidence-details"
        >
          {expanded ? "Hide" : "Why this happened?"}
        </button>
        {onSuggestFollowUp && (
          <button
            type="button"
            onClick={() => onSuggestFollowUp(FOLLOW_UP_TEMPLATE)}
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-xs font-medium text-aistroyka-text-secondary hover:bg-aistroyka-surface-muted focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          >
            Suggest a follow-up question
          </button>
        )}
      </div>
      {expanded && (
        <p
          id="low-confidence-details"
          className="mt-2 text-aistroyka-text-secondary"
          role="region"
          aria-label="Explanation"
        >
          {WHY_TEXT}
        </p>
      )}
    </div>
  );
}
