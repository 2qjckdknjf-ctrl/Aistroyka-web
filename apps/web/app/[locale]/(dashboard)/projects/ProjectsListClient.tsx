"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useProjects } from "@/lib/projects/useProjects";
import { usePrefetchProject } from "@/lib/projects/prefetchProject";
import { useProjectIdsWithActiveRisk, useProjectRisks } from "@/lib/features/ai/useAIState";
import { QueryBoundary } from "@/lib/query/render";
import { Card } from "@/components/ui";
import { AISignalLine } from "@/components/ai/AISignalLine";
import type { ProjectRow } from "@/lib/supabase/rpc";

function riskScoreColorClass(score: number): string {
  if (score <= 30) return "text-aistroyka-text-tertiary";
  if (score <= 60) return "text-aistroyka-accent";
  if (score <= 80) return "text-aistroyka-warning";
  return "text-aistroyka-error";
}

export interface ProjectsListClientProps {
  t: (key: string) => string;
  locale: string;
  canCreate: boolean;
  createForm: React.ReactNode;
}

export function ProjectsListClient({
  t,
  locale,
  canCreate,
  createForm,
}: ProjectsListClientProps) {
  const query = useProjects();
  const prefetchProject = usePrefetchProject();
  const projectIdsWithRisk = useProjectIdsWithActiveRisk();
  const projectIds = useMemo(() => (query.data ?? []).map((p) => p.id), [query.data]);
  const riskMap = useProjectRisks(projectIds);

  return (
    <QueryBoundary
      query={{
        data: query.data,
        isPending: query.isPending,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
      }}
      emptyCondition={(data) => !data || data.length === 0}
      emptyTitle={t("noProjects")}
      emptySubtitle={t("noProjectsHint")}
      emptyAction={canCreate ? createForm : undefined}
      loadingFallback={
        <Card className="overflow-hidden p-0">
          <div className="h-32 animate-pulse rounded bg-aistroyka-surface-muted" />
        </Card>
      }
    >
      {(projectList: ProjectRow[]) => (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[260px] text-left text-aistroyka-subheadline">
              <thead>
                <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
                  <th className="table-cell w-6 py-2 pr-0" aria-label="AI Signal" />
                  <th className="table-cell font-semibold text-aistroyka-text-primary">
                    {t("name")}
                  </th>
                  <th className="table-cell font-semibold text-aistroyka-text-primary">
                    {t("created")}
                  </th>
                  <th className="table-cell w-14 font-semibold text-aistroyka-text-primary">
                    Risk
                  </th>
                  <th className="table-cell font-semibold text-aistroyka-text-primary">
                    {t("action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {projectList.map((p) => {
                  const hasRisk = projectIdsWithRisk.includes(p.id);
                  const riskRow = riskMap[p.id];
                  const riskScore = riskRow?.total_score ?? null;
                  return (
                  <tr
                    key={p.id}
                    className="border-b border-aistroyka-border-subtle last:border-0 transition-colors hover:bg-aistroyka-surface-raised/50"
                  >
                    <td className="table-cell w-6 py-2 pr-0 align-middle">
                      {(hasRisk || riskScore != null) && (
                        <span title="AI Signal indicates active intelligence insights.">
                          <AISignalLine state={hasRisk ? "risk_detected" : "idle"} totalScore={riskScore ?? undefined} />
                        </span>
                      )}
                    </td>
                    <td className="table-cell font-medium text-aistroyka-text-primary">
                      {p.name}
                    </td>
                    <td className="table-cell text-aistroyka-text-secondary tabular-nums">
                      {new Date(p.created_at).toLocaleDateString(locale)}
                    </td>
                    <td className="table-cell w-14 tabular-nums">
                      {riskScore !== null ? (
                        <span className={`font-medium ${riskScoreColorClass(riskScore)}`} title="AI Risk Score 0–100">
                          {riskScore}
                        </span>
                      ) : (
                        <span className="text-aistroyka-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                        <Link
                          href={`/projects/${p.id}`}
                          onMouseEnter={() => prefetchProject(p.id)}
                          className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm"
                        >
                          {t("open")}
                        </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </QueryBoundary>
  );
}
