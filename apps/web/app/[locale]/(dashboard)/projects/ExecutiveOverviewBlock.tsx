"use client";

import { Badge } from "@/components/ui-lite";

type HealthClassification = "Healthy" | "Moderate" | "Unstable" | "Critical";
type StrategicClassification = "Stable" | "Watch" | "Critical";
type DelayProbability = "low" | "medium" | "high";

function healthStatusStyles(c: HealthClassification): {
  bar: string;
  tint: string;
  badgeVariant: "success" | "warning" | "danger" | "neutral";
} {
  if (c === "Healthy") return { bar: "border-l-emerald-500", tint: "bg-emerald-50/50", badgeVariant: "success" };
  if (c === "Moderate") return { bar: "border-l-amber-500", tint: "bg-aistroyka-warning/20/40", badgeVariant: "warning" };
  if (c === "Unstable" || c === "Critical") return { bar: "border-l-red-500", tint: "bg-aistroyka-error/10/40", badgeVariant: "danger" };
  return { bar: "border-l-slate-300", tint: "bg-aistroyka-surface-raised/50", badgeVariant: "neutral" };
}

function strategicBadgeVariant(c: StrategicClassification): "success" | "warning" | "danger" | "neutral" {
  if (c === "Stable") return "success";
  if (c === "Watch") return "warning";
  if (c === "Critical") return "danger";
  return "neutral";
}

function delayLabel(p: DelayProbability): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function ExecutiveOverviewBlock({
  completionPercent,
  healthScore,
  healthClassification,
  strategicRiskIndex,
  strategicClassification,
  delayProbability,
  executiveSummary,
  hasData,
}: {
  completionPercent: number;
  healthScore: number;
  healthClassification: HealthClassification;
  strategicRiskIndex: number;
  strategicClassification: StrategicClassification;
  delayProbability: DelayProbability;
  executiveSummary: string;
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-white p-4 sm:p-6">
        <p className="text-sm text-aistroyka-text-secondary">
          No analyses yet. Upload an image and run analysis to see the executive overview.
        </p>
      </div>
    );
  }

  const { bar, tint, badgeVariant } = healthStatusStyles(healthClassification);

  return (
    <div
      className={`rounded-lg border border-aistroyka-border-subtle border-l-4 ${bar} ${tint} p-4 sm:p-6`}
    >
      {/* Health as dominant KPI: large, central */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight text-aistroyka-text-primary sm:text-4xl">
            {healthScore}
          </span>
          <span className="text-lg font-medium text-aistroyka-text-tertiary sm:text-xl">Health Score</span>
          <Badge variant={badgeVariant} className="px-2.5 py-1 font-semibold">
            {healthClassification}
          </Badge>
        </div>
        {/* Secondary: Strategic Risk */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div>
            <span className="text-aistroyka-text-tertiary">Strategic Risk </span>
            <span className="font-semibold text-aistroyka-text-primary">{strategicRiskIndex}</span>
            <Badge variant={strategicBadgeVariant(strategicClassification)} className="ml-1.5">
              {strategicClassification}
            </Badge>
          </div>
          <span className="text-aistroyka-text-tertiary">|</span>
          <div>
            <span className="text-aistroyka-text-tertiary">Delay </span>
            <Badge
              variant={
                delayProbability === "high" ? "danger" : delayProbability === "medium" ? "warning" : "neutral"
              }
            >
              {delayLabel(delayProbability)}
            </Badge>
          </div>
        </div>
      </div>
      {/* Contextual: Completion */}
      <div className="mt-4 flex items-center gap-2 text-sm text-aistroyka-text-secondary">
        <span>Completion</span>
        <span className="font-medium text-aistroyka-text-primary">{completionPercent}%</span>
      </div>
      {executiveSummary ? (
        <p className="mt-4 max-w-prose border-t border-aistroyka-border-subtle/80 pt-4 text-sm leading-relaxed text-aistroyka-text-primary">
          {executiveSummary}
        </p>
      ) : null}
    </div>
  );
}
