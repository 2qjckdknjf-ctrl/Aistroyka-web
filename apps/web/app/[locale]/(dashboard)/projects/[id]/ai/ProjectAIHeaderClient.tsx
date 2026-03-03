"use client";

import { Link } from "@/i18n/navigation";
import { useAIState, useProjectRisk } from "@/lib/features/ai/useAIState";
import { AISignalLine } from "@/components/ai/AISignalLine";

export interface ProjectAIHeaderClientProps {
  projectId: string;
  projectName: string;
}

/**
 * AI Copilot header: back link, title, AISignalLine (color by risk score when available), and current state + last event title from backend.
 */
export function ProjectAIHeaderClient({ projectId, projectName }: ProjectAIHeaderClientProps) {
  const { state, lastEvent } = useAIState(projectId);
  const { risk } = useProjectRisk(projectId);

  return (
    <div className="mb-aistroyka-6 flex flex-col gap-aistroyka-2 sm:flex-row sm:items-center sm:gap-aistroyka-4">
      <Link
        href={`/projects/${projectId}`}
        className="text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent w-fit min-h-aistroyka-touch inline-flex items-center focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-md"
      >
        ← Back to project
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span title="AI Signal indicates active intelligence insights." className="shrink-0">
          <AISignalLine state={state} severity={lastEvent?.severity ?? null} totalScore={risk?.total_score ?? undefined} />
        </span>
        <div className="min-w-0">
          <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
            AI Copilot — {projectName}
          </h1>
          {lastEvent && (
            <p className="mt-0.5 text-aistroyka-subheadline text-aistroyka-text-secondary">
              {lastEvent.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
