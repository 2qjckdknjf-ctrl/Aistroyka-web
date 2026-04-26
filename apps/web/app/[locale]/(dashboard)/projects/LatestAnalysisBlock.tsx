"use client";

import { useTranslations } from "next-intl";
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
  const tDetail = useTranslations("dashboardDetail");
  if (!hasData) {
    return (
      <Card>
        <p className="text-sm text-aistroyka-text-secondary">
          {tDetail("noCompletedAnalysisLatestBlock")}
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
          <span className="text-aistroyka-text-tertiary">{tDetail("stage")}:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">{stage ?? "—"}</span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("completion")}:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">{completionPercent}%</span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("risk")}:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary capitalize">{riskLevel}</span>
        </div>
      </div>
      {issues.length > 0 ? (
        <div className="mt-2">
          <span className="text-sm text-aistroyka-text-tertiary">{tDetail("keyIssues")}:</span>
          <ul className="mt-1 list-inside list-disc text-sm text-aistroyka-text-primary">
            {issues.map((i, idx) => (
              <li key={`${idx}-${i.slice(0, 40)}`}>{i}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {recs.length > 0 ? (
        <div className="mt-2">
          <span className="text-sm text-aistroyka-text-tertiary">{tDetail("keyRecommendations")}:</span>
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
