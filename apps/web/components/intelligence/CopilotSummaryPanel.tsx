"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IntelligenceCard } from "./IntelligenceCard";
import { Card, Skeleton, ErrorState } from "@/components/ui";

type UseCase = "generateManagerBrief" | "generateExecutiveBrief" | "detectTopRisks" | "findMissingEvidence" | "identifyBlockedTasks" | "summarizeProjectStatus";

interface CopilotResponse {
  useCase: string;
  summary?: string;
  managerBrief?: string;
  executiveBrief?: string;
  risks?: string[];
  missingEvidence?: string[];
  blockedTasks?: string[];
  at: string;
  source: string;
}

async function fetchCopilotBrief(projectId: string, useCase: UseCase): Promise<CopilotResponse> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/copilot?useCase=${encodeURIComponent(useCase)}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load brief");
  }
  const json = await res.json();
  return json.data;
}

export function CopilotSummaryPanel({ projectId }: { projectId: string }) {
  const [useCase, setUseCase] = useState<UseCase>("generateManagerBrief");
  const { data, isPending, isError, error, refetch } = useQuery<CopilotResponse>({
    queryKey: ["copilot-brief", projectId, useCase],
    queryFn: () => fetchCopilotBrief(projectId, useCase),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const brief =
    data?.managerBrief ??
    data?.executiveBrief ??
    data?.summary ??
    (data?.risks?.length ? data.risks.join(". ") : null) ??
    (data?.missingEvidence?.length ? data.missingEvidence.join(". ") : null) ??
    (data?.blockedTasks?.length ? data.blockedTasks.join(". ") : null);

  const showDemoMode = !isPending && (isError || !brief);

  const DEMO_SUMMARY = "Project is on track. Foundation phase at 85% completion. Key milestones met; one task pending photo evidence.";
  const DEMO_RISKS = ["Delayed material delivery may impact schedule", "Missing evidence for completed task T-102"];
  const DEMO_RECOMMENDATIONS = ["Upload before/after photos for completed tasks", "Confirm delivery date with supplier"];

  return (
    <IntelligenceCard title="Copilot brief" aria-label="Copilot summary">
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            "generateManagerBrief",
            "generateExecutiveBrief",
            "detectTopRisks",
            "findMissingEvidence",
            "identifyBlockedTasks",
            "summarizeProjectStatus",
          ] as UseCase[]
        ).map((uc) => (
          <button
            key={uc}
            type="button"
            onClick={() => setUseCase(uc)}
            className={`rounded-[var(--aistroyka-radius-md)] border px-2 py-1 text-aistroyka-caption font-medium transition-colors ${
              useCase === uc
                ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
            }`}
          >
            {uc.replace(/([A-Z])/g, " $1").trim()}
          </button>
        ))}
      </div>
      {isError && !showDemoMode && (
        <ErrorState
          message="Brief unavailable"
          onRetry={() => void (refetch as () => Promise<unknown>)()}
        />
      )}
      {isPending && <Skeleton className="h-20 w-full" />}
      {showDemoMode && (
        <div className="space-y-3 text-aistroyka-subheadline" data-demo-mode>
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            Sample insights (no data yet)
          </p>
          <p className="text-aistroyka-text-primary">{DEMO_SUMMARY}</p>
          <div>
            <span className="font-medium text-aistroyka-text-primary">Top risks: </span>
            <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
              {DEMO_RISKS.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-medium text-aistroyka-text-primary">Recommendations: </span>
            <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
              {DEMO_RECOMMENDATIONS.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {!isPending && !isError && data && brief && (
        <>
          <p className="text-aistroyka-subheadline text-aistroyka-text-primary whitespace-pre-wrap">
            {brief}
          </p>
          <p className="mt-2 text-aistroyka-caption text-aistroyka-text-tertiary">
            Source: {data.source} · {new Date(data.at).toLocaleString()}
          </p>
        </>
      )}
      {!isPending && !isError && data && !brief && !showDemoMode && (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No brief content</p>
      )}
    </IntelligenceCard>
  );
}
