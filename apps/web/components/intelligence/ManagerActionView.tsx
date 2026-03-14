"use client";

import { Link } from "@/i18n/navigation";
import { getResourceHref } from "@/lib/intelligence/resource-links";
import type {
  ProjectIntelligenceData,
  ActionRecommendationData,
  MissingEvidenceInsightData,
  TopRiskInsightData,
} from "./types";

interface ManagerAction {
  id: string;
  title: string;
  reason: string;
  source: "missing_evidence" | "top_risk" | "recommendation" | "health" | "executive";
  priority: "high" | "medium" | "low";
  href: string | null;
  projectId: string;
  nextStep?: string;
}

function severityOrder(p: "high" | "medium" | "low"): number {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

function buildActions(data: ProjectIntelligenceData, projectId: string): ManagerAction[] {
  const actions: ManagerAction[] = [];

  for (const me of data.missingEvidenceInsights ?? []) {
    const ref = me.evidenceReferences?.[0];
    const href = ref
      ? getResourceHref(ref.resourceType, ref.resourceId, projectId)
      : null;
    actions.push({
      id: me.id,
      title: me.title,
      reason: me.explanation,
      source: "missing_evidence",
      priority: me.severity,
      href,
      projectId,
      nextStep: me.recommendedAction,
    });
  }

  for (const r of data.topRiskInsights ?? []) {
    const ref = r.evidenceReferences?.[0];
    const href = ref
      ? getResourceHref(ref.resourceType, ref.resourceId, projectId)
      : null;
    actions.push({
      id: r.id,
      title: `#${r.rank} ${r.title}`,
      reason: r.explanation,
      source: "top_risk",
      priority: r.severity,
      href,
      projectId,
      nextStep: r.recommendedAction,
    });
  }

  for (const rec of data.recommendations ?? []) {
    const href =
      rec.relatedResourceType && rec.relatedResourceId
        ? getResourceHref(rec.relatedResourceType, rec.relatedResourceId, rec.projectId)
        : `/dashboard/projects/${rec.projectId}`;
    actions.push({
      id: rec.id,
      title: rec.title,
      reason: rec.description ?? rec.title,
      source: "recommendation",
      priority: rec.priority,
      href,
      projectId: rec.projectId,
    });
  }

  const execActions = data.executiveProjectSummary?.recommendedActions ?? [];
  if (execActions.length > 0 && actions.length < 3) {
    for (let i = 0; i < Math.min(2, execActions.length); i++) {
      actions.push({
        id: `exec-${i}`,
        title: execActions[i],
        reason: "From executive summary",
        source: "executive",
        priority: "medium",
        href: `/dashboard/projects/${projectId}`,
        projectId,
      });
    }
  }

  return actions
    .sort((a, b) => severityOrder(a.priority) - severityOrder(b.priority))
    .slice(0, 7);
}

function priorityClass(p: "high" | "medium" | "low"): string {
  if (p === "high") return "border-l-aistroyka-error bg-aistroyka-error/5";
  if (p === "medium") return "border-l-amber-500 bg-amber-500/5";
  return "border-l-aistroyka-info bg-aistroyka-info/5";
}

export function ManagerActionView({
  data,
  projectId,
}: {
  data: ProjectIntelligenceData;
  projectId: string;
}) {
  const actions = buildActions(data, projectId);

  if (actions.length === 0) {
    return (
      <section
        className="rounded-lg border border-aistroyka-border-subtle bg-white p-4"
        aria-label="Manager actions"
      >
        <h3 className="text-base font-semibold text-aistroyka-text-primary">
          What needs attention
        </h3>
        <p className="mt-2 text-sm text-aistroyka-text-secondary">
          Nothing urgent. Continue monitoring.
        </p>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          View project →
        </Link>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-aistroyka-border-subtle bg-white p-4"
      aria-label="Manager actions"
    >
      <h3 className="text-base font-semibold text-aistroyka-text-primary mb-3">
        What needs attention
      </h3>
      <ul className="space-y-2">
        {actions.map((a) => (
          <li
            key={a.id}
            className={`rounded-md border-l-4 px-3 py-2 ${priorityClass(a.priority)}`}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium text-aistroyka-text-primary">
                {a.title}
              </span>
              <span className="text-xs text-aistroyka-text-tertiary">
                {a.source.replace("_", " ")}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-aistroyka-text-secondary">
              {a.reason}
            </p>
            {a.nextStep && (
              <p className="mt-0.5 text-xs text-aistroyka-text-tertiary">
                Next: {a.nextStep}
              </p>
            )}
            {a.href && (
              <Link
                href={a.href}
                className="mt-1.5 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
              >
                Open →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
