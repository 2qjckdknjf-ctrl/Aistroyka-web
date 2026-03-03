"use client";

import { Card } from "@/components/ui-lite";

const MAX_ISSUES = 3;
const MAX_RECOMMENDATIONS = 3;

export function LatestAnalysisBlock({
  stage,
  completionPercent,
  riskLevel,
  detectedIssues,
  recommendations,
  hasData,
}: {
  stage: string | null;
  completionPercent: number;
  riskLevel: string;
  detectedIssues: string[];
  recommendations: string[];
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <Card>
        <p className="text-sm text-aistroyka-text-secondary">
          No completed analysis yet. Run analysis to see stage, issues, and recommendations.
        </p>
      </Card>
    );
  }

  const issues = (detectedIssues ?? []).slice(0, MAX_ISSUES);
  const recs = (recommendations ?? []).slice(0, MAX_RECOMMENDATIONS);

  return (
    <Card>
      <div className="mb-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-aistroyka-text-tertiary">Stage:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">{stage ?? "—"}</span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Completion:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">{completionPercent}%</span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Risk:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary capitalize">{riskLevel}</span>
        </div>
      </div>
      {issues.length > 0 ? (
        <div className="mt-2">
          <span className="text-sm text-aistroyka-text-tertiary">Key issues:</span>
          <ul className="mt-1 list-inside list-disc text-sm text-aistroyka-text-primary">
            {issues.map((i, idx) => (
              <li key={`${idx}-${i.slice(0, 40)}`}>{i}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {recs.length > 0 ? (
        <div className="mt-2">
          <span className="text-sm text-aistroyka-text-tertiary">Key recommendations:</span>
          <ul className="mt-1 list-inside list-disc text-sm text-aistroyka-text-primary">
            {recs.map((r, idx) => (
              <li key={`${idx}-${r.slice(0, 40)}`}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
