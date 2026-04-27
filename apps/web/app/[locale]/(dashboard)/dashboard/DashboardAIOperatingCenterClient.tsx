"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { getResourceHref } from "@/lib/intelligence/resource-links";
import { useProjects } from "@/lib/projects/useProjects";
import {
  ProjectHealthPanel,
  RiskList,
  IntelligenceCard,
  EvidenceCoverageCard,
  SummaryCard,
  type ProjectIntelligenceData,
} from "@/components/intelligence";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import type { TopRiskInsightData } from "@/components/intelligence/types";

async function fetchIntelligence(projectId: string): Promise<ProjectIntelligenceData> {
  const res = await fetch(`/api/v1/projects/${projectId}/intelligence`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load intelligence");
  }
  const json = await res.json();
  return json.data;
}

interface OpsOverview {
  kpis: {
    tasks_overdue?: number;
    tasks_open_today?: number;
    tasks_assigned_today?: number;
    tasks_completed_today?: number;
    reportsToday?: number;
    activeWorkersToday?: number;
  };
  queues: {
    tasksOverdue?: { id: string; title: string; due_date: string }[];
    tasksOpenToday?: { id: string; title: string; due_date: string }[];
    reportsPendingReview: { id: string }[];
    workersOpenShiftNoReportToday?: { user_id: string; day_date: string }[];
  };
}

async function fetchOpsOverview(): Promise<OpsOverview> {
  const res = await fetch("/api/v1/ops/overview?limit=5", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load ops");
  return res.json();
}

function TeamProductivityCard({ ops }: { ops: OpsOverview }) {
  const tDetail = useTranslations("dashboardDetail");
  const k = ops.kpis;
  const q = ops.queues;
  const hasOverdue = (k.tasks_overdue ?? 0) > 0 || (q.tasksOverdue ?? []).length > 0;
  const hasOpenToday = (k.tasks_open_today ?? 0) > 0 || (q.tasksOpenToday ?? []).length > 0;
  const pendingReports = q.reportsPendingReview?.length ?? 0;
  const noReport = (q.workersOpenShiftNoReportToday ?? []).length;

  return (
    <IntelligenceCard title={tDetail("teamProductivity")} aria-label={tDetail("teamProductivity")}>
      <p className="text-aistroyka-caption text-aistroyka-text-tertiary mb-3">
        {tDetail("teamProductivityHint")}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-aistroyka-subheadline">
        <dt className="text-aistroyka-text-tertiary">{tDetail("tasksOverdue")}</dt>
        <dd>
          <Link
            href="/dashboard/tasks?status=pending"
            className="font-medium text-aistroyka-accent hover:underline"
          >
            {k.tasks_overdue ?? 0}
          </Link>
        </dd>
        <dt className="text-aistroyka-text-tertiary">{tDetail("openToday")}</dt>
        <dd>
          <Link
            href="/dashboard/tasks"
            className="font-medium text-aistroyka-accent hover:underline"
          >
            {k.tasks_open_today ?? 0}
          </Link>
        </dd>
        <dt className="text-aistroyka-text-tertiary">{tDetail("reportsPendingReview")}</dt>
        <dd>
          <Link
            href="/dashboard/approvals"
            className="font-medium text-aistroyka-accent hover:underline"
          >
            {pendingReports}
          </Link>
        </dd>
        <dt className="text-aistroyka-text-tertiary">{tDetail("shiftOpenNoReportToday")}</dt>
        <dd>{noReport}</dd>
      </dl>
      {(hasOverdue || hasOpenToday) && (
        <ul className="mt-3 space-y-1 text-sm">
          {(q.tasksOverdue ?? []).slice(0, 2).map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/tasks/${t.id}`}
                className="text-aistroyka-accent hover:underline"
              >
                {tDetail("overduePrefix")} {t.title.slice(0, 35)}{t.title.length > 35 ? "…" : ""}
              </Link>
            </li>
          ))}
          {(q.tasksOpenToday ?? []).slice(0, 2).map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/tasks/${t.id}`}
                className="text-aistroyka-accent hover:underline"
              >
                {tDetail("dueTodayPrefix")} {t.title.slice(0, 30)}{t.title.length > 30 ? "…" : ""}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/dashboard/tasks"
        className="mt-3 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
      >
        {tDetail("viewAllTasksArrow")}
      </Link>
    </IntelligenceCard>
  );
}

export function DashboardAIOperatingCenterClient() {
  const tDetail = useTranslations("dashboardDetail");
  const projectsQuery = useProjects();
  const projects = projectsQuery.data ?? [];
  const firstProjectId = projects[0]?.id ?? null;
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  useEffect(() => {
    if (firstProjectId && focusProjectId === null) setFocusProjectId(firstProjectId);
  }, [firstProjectId, focusProjectId]);
  const effectiveFocus =
    focusProjectId && projects.some((p) => p.id === focusProjectId)
      ? focusProjectId
      : firstProjectId ?? null;

  const intelligenceQuery = useQuery({
    queryKey: ["project-intelligence", effectiveFocus],
    queryFn: () => fetchIntelligence(effectiveFocus!),
    enabled: !!effectiveFocus,
    staleTime: 60 * 1000,
  });

  const opsQuery = useQuery({
    queryKey: ["ops-overview"],
    queryFn: fetchOpsOverview,
    staleTime: 60 * 1000,
  });

  const data = intelligenceQuery.data;
  const ops = opsQuery.data;
  const isLoading = projectsQuery.isPending || (!!effectiveFocus && intelligenceQuery.isPending);
  const noProject = !effectiveFocus || projects.length === 0;

  const emptyIntelligenceMessage = noProject
    ? tDetail("selectProjectForIntelligence")
    : tDetail("noHealthDataYet");

  return (
    <section className="space-y-4" aria-label={tDetail("aiOperatingCenter")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          {tDetail("aiOperatingCenter")}
        </h2>
        {projects.length > 1 && (
          <label className="flex items-center gap-2 text-aistroyka-subheadline">
            <span className="text-aistroyka-text-tertiary">{tDetail("focusProject")}</span>
            <select
              value={effectiveFocus ?? ""}
              onChange={(e) => setFocusProjectId(e.target.value || null)}
              className="rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1 text-aistroyka-text-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {effectiveFocus && (
          <Link
            href={`/dashboard/projects/${effectiveFocus}?tab=intelligence`}
            className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
          >
            {tDetail("openFullIntelligence")}
          </Link>
        )}
      </div>

      {noProject && (
        <Card className="border-l-4 border-l-aistroyka-info p-4">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {tDetail("createOrOpenProjectHint")}
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-2 inline-block font-medium text-aistroyka-accent hover:underline"
          >
            {tDetail("browseProjectsArrow")}
          </Link>
        </Card>
      )}

      {!noProject && intelligenceQuery.isError && (
        <ErrorState
          message={intelligenceQuery.error instanceof Error ? intelligenceQuery.error.message : tDetail("failedLoadIntelligence")}
          onRetry={() => intelligenceQuery.refetch()}
        />
      )}

      {!noProject && isLoading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </Card>
          ))}
        </div>
      )}

      {!noProject && (data || ops) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProjectHealthPanel
            health={data?.projectHealthScore ?? data?.health ?? null}
            emptyMessage={emptyIntelligenceMessage}
          />

          <IntelligenceCard title={tDetail("riskRadar")} aria-label={tDetail("riskOverview")}>
            {data?.riskOverview ? (
              <>
                <div className="flex flex-wrap gap-2 text-aistroyka-caption">
                  <span className="font-medium text-aistroyka-error">{tDetail("highLabel")} {data.riskOverview.high}</span>
                  <span className="font-medium text-amber-600">{tDetail("mediumLabel")} {data.riskOverview.medium}</span>
                  <span className="font-medium text-aistroyka-info">{tDetail("lowLabel")} {data.riskOverview.low}</span>
                </div>
                <div className="mt-3">
                  <RiskList
                    risks={data.riskOverview.signals ?? []}
                    maxItems={3}
                    emptyMessage={
                      (data.topRiskInsights?.length ?? 0) > 0
                        ? tDetail("seeRankedRisksBelow")
                        : tDetail("noRisksFlagged")
                    }
                  />
                </div>
                {data.topRiskInsights && data.topRiskInsights.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {data.topRiskInsights.slice(0, 3).map((r: TopRiskInsightData) => {
                      const ref = r.evidenceReferences?.[0];
                      const href = ref && effectiveFocus
                        ? getResourceHref(ref.resourceType, ref.resourceId, effectiveFocus)
                        : null;
                      return (
                        <li key={r.id} className="flex flex-col gap-0.5">
                          <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                            #{r.rank} {r.title}
                          </span>
                          <p className="text-xs text-aistroyka-text-tertiary">{r.recommendedAction}</p>
                          {r.missingDataDisclaimer && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">{r.missingDataDisclaimer}</p>
                          )}
                          {href && (
                            <Link href={href} className="text-sm font-medium text-aistroyka-accent hover:underline">
                              {tDetail("openRelated")}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Link
                  href={effectiveFocus ? `/dashboard/projects/${effectiveFocus}?tab=intelligence` : "#"}
                  className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
                >
                  {tDetail("fullRiskRadar")}
                </Link>
              </>
            ) : (
              <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("noRiskDataYet")}</p>
            )}
          </IntelligenceCard>

          {data?.executiveProjectSummary || data?.executiveSummary ? (
            <SummaryCard summary={data.executiveProjectSummary ?? data.executiveSummary!} />
          ) : (
            <IntelligenceCard title={tDetail("aiInsights")} aria-label={tDetail("aiInsights")}>
              <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
                {tDetail("noSummaryYet")}
              </p>
              {effectiveFocus && (
                <Link
                  href={`/dashboard/projects/${effectiveFocus}?tab=intelligence`}
                  className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  {tDetail("openIntelligence")}
                </Link>
              )}
            </IntelligenceCard>
          )}

          <EvidenceCoverageCard
            signals={data?.evidenceCoverage?.signals ?? []}
            emptyMessage={tDetail("noEvidenceGaps")}
          />

          {ops ? <TeamProductivityCard ops={ops} /> : (
            <Card className="p-4">
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
