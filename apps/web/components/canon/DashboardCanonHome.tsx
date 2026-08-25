"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  FolderKanban,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  CanonPageHeader,
  CanonPortfolioAiPanel,
  getCanonProjectGradient,
} from "@/components/canon";
import {
  aggregatePortfolioBudget,
  averageTaskProgress,
  fetchOpsOverviewCanon,
  fetchPortfolioControl,
  fetchProjectSummary,
  portfolioStateToRisk,
  taskProgressPct,
} from "@/components/canon/canon-live-data";
import { useProjects } from "@/lib/projects/useProjects";
import { usePrefetchProject } from "@/lib/projects/prefetchProject";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function riskClass(level: "high" | "medium" | "low") {
  return `canon-risk-badge canon-risk-badge--${level}`;
}

export function DashboardCanonHome() {
  const t = useTranslations("canon");
  const tDash = useTranslations("dashboard");
  const projectsQuery = useProjects();
  const prefetchProject = usePrefetchProject();
  const opsQuery = useQuery({
    queryKey: ["ops-overview-canon"],
    queryFn: () => fetchOpsOverviewCanon(8),
    staleTime: 60_000,
  });
  const portfolioQuery = useQuery({
    queryKey: ["portfolio-control"],
    queryFn: fetchPortfolioControl,
    staleTime: 60_000,
  });

  const projects = projectsQuery.data ?? [];
  const visibleProjects = projects.slice(0, 6);
  const summaryQueries = useQueries({
    queries: visibleProjects.map((p) => ({
      queryKey: ["project-summary", p.id],
      queryFn: () => fetchProjectSummary(p.id),
      staleTime: 60_000,
    })),
  });

  const summaries = useMemo(
    () => summaryQueries.map((q) => q.data).filter(Boolean) as NonNullable<typeof summaryQueries[0]["data"]>[],
    [summaryQueries],
  );

  const controlById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof portfolioQuery.data>["projects"][number]>();
    for (const row of portfolioQuery.data?.projects ?? []) {
      map.set(row.id, row);
    }
    return map;
  }, [portfolioQuery.data]);

  const ops = opsQuery.data;
  const kpis = ops?.kpis;
  const activeProjects = kpis?.activeProjects ?? projects.length;
  const overdueTasks = kpis?.tasks_overdue ?? 0;
  const budgetAgg = aggregatePortfolioBudget(summaries);
  const avgProgress = averageTaskProgress(summaries);
  const highRiskCount = portfolioQuery.data?.distribution.critical ?? 0;

  const kpiCards = [
    {
      icon: FolderKanban,
      label: t("kpiActiveProjects"),
      value: String(activeProjects),
      trend:
        kpis?.tasks_completed_today != null
          ? t("tasksCompletedToday", { count: kpis.tasks_completed_today })
          : t("portfolioCountHint", { count: projects.length }),
      trendUp: true,
    },
    {
      icon: Wallet,
      label: t("kpiTotalBudget"),
      value:
        budgetAgg.planned > 0
          ? `${budgetAgg.actual.toLocaleString()} / ${budgetAgg.planned.toLocaleString()} ${budgetAgg.currency}`
          : "—",
      sub: budgetAgg.planned > 0 ? undefined : t("budgetPending"),
      trend: budgetAgg.planned > 0 ? t("budgetUtilization", { pct: budgetAgg.utilizationPct }) : "—",
      trendUp: !budgetAgg.planned || budgetAgg.utilizationPct <= 100,
    },
    {
      icon: TrendingUp,
      label: t("kpiAvgProgress"),
      value: summaries.length ? `${avgProgress}%` : "—",
      sub: summaries.length ? undefined : t("progressPending"),
      trend: summaries.length ? t("tasksDoneRatio", { done: summaries.reduce((a, s) => a + s.tasksDone, 0), total: summaries.reduce((a, s) => a + s.tasksTotal, 0) }) : "—",
      trendUp: true,
    },
    {
      icon: AlertTriangle,
      label: t("kpiCriticalTasks"),
      value: String(overdueTasks),
      trend: overdueTasks > 0 ? t("requiresAttention") : t("systemOk"),
      trendUp: overdueTasks === 0,
    },
  ];

  const attentionItems = useMemo(() => {
    const items: Array<{ id: string; project: string; title: string; level: "high" | "medium"; href: string }> = [];
    for (const task of ops?.queues.tasksOverdue ?? []) {
      items.push({
        id: task.id,
        project: task.title,
        title: t("attentionOverdueTask"),
        level: "high",
        href: `/dashboard/tasks?task=${task.id}`,
      });
    }
    for (const report of ops?.queues.reportsPendingReview ?? []) {
      items.push({
        id: report.id,
        project: new Date(report.created_at).toLocaleDateString(),
        title: t("attentionReportReview"),
        level: "medium",
        href: `/dashboard/reports/${report.id}`,
      });
    }
    return items.slice(0, 4);
  }, [ops, t]);

  const activityItems = useMemo(() => {
    const items: Array<{ id: string; text: string; href?: string; icon: "building" | "task" }> = [];
    for (const report of ops?.queues.reportsPendingReview ?? []) {
      items.push({
        id: `report-${report.id}`,
        text: t("activityReportPending", { date: new Date(report.created_at).toLocaleDateString() }),
        href: `/dashboard/reports/${report.id}`,
        icon: "building",
      });
    }
    for (const upload of ops?.queues.stuckUploads ?? []) {
      items.push({
        id: `upload-${upload.id}`,
        text: t("activityStuckUpload", { date: new Date(upload.created_at).toLocaleDateString() }),
        href: "/dashboard/uploads",
        icon: "task",
      });
    }
    return items.slice(0, 4);
  }, [ops, t]);

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tDash("title")}
        subtitle={t("screen01Label")}
        actions={
          <>
            <button type="button" className="canon-ghost-btn">{t("filters")}</button>
            <Link href="/projects/new" className="canon-gold-btn">{t("createProject")}</Link>
          </>
        }
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} custom={i} variants={fadeUp} className="canon-glass canon-kpi-card">
              <div className="canon-kpi-card-icon">
                <Icon size={22} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="canon-kpi-label">{kpi.label}</p>
                <p className="canon-kpi-value mt-1">{kpi.value}</p>
                {kpi.sub ? (
                  <p className="mt-1 text-xs text-[var(--canon-text-muted)]">{kpi.sub}</p>
                ) : null}
                <p
                  className={`canon-kpi-trend mt-2 ${kpi.trendUp ? "canon-kpi-trend--up" : "canon-kpi-trend--down"}`}
                >
                  {kpi.trend}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="canon-glass overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--canon-border-glass)] px-4 py-3">
              <h2 className="canon-section-title">{t("activeProjects")}</h2>
              <button type="button" className="text-xs font-medium text-[var(--canon-text-muted)]">
                {t("viewCards")} ▾
              </button>
            </div>
            {projectsQuery.isPending ? (
              <div className="p-8 text-center text-[var(--canon-text-muted)]">{tDash("loading")}</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--canon-text-secondary)]">{tDash("noProjectsYet")}</p>
                <Link href="/projects/new" className="canon-gold-btn mt-4 inline-flex">
                  {tDash("createOne")}
                </Link>
              </div>
            ) : (
              <div className="canon-data-table-wrap">
                <table className="canon-data-table">
                  <thead>
                    <tr>
                      <th>{t("colProject")}</th>
                      <th>{t("colProgress")}</th>
                      <th>{t("colBudget")}</th>
                      <th>{t("colDeadline")}</th>
                      <th>{t("colRisk")}</th>
                      <th>{t("colManager")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProjects.map((p, idx) => {
                      const control = controlById.get(p.id);
                      const summary = summaryQueries[idx]?.data;
                      const progress = taskProgressPct(summary);
                      const risk = portfolioStateToRisk(control?.portfolioState ?? "healthy");
                      const riskLabel =
                        risk === "high" ? t("riskHigh") : risk === "medium" ? t("riskMedium") : t("riskLow");
                      const budgetLabel =
                        summary && summary.budgetPlannedTotal > 0
                          ? `${summary.budgetActualTotal.toLocaleString()} / ${summary.budgetPlannedTotal.toLocaleString()} ${summary.budgetCurrency}`
                          : t("budgetPending");
                      return (
                        <tr key={p.id}>
                          <td>
                            <Link
                              href={`/projects/${p.id}`}
                              onMouseEnter={() => prefetchProject(p.id)}
                              className="flex items-center gap-3 group"
                            >
                              <span
                                className="h-10 w-10 shrink-0 rounded-lg"
                                style={{ background: getCanonProjectGradient(p.id) }}
                                aria-hidden
                              />
                              <span className="font-medium text-[var(--canon-text-primary)] group-hover:text-[var(--canon-gold)]">
                                {p.name}
                              </span>
                            </Link>
                          </td>
                          <td>
                            <div className="canon-progress-track max-w-[120px]">
                              <div className="canon-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="mt-1 text-xs tabular-nums">{progress}%</span>
                          </td>
                          <td className="text-xs">{budgetLabel}</td>
                          <td className="text-xs">
                            {summary && summary.overdueMilestonesCount > 0
                              ? t("milestonesOverdue", { count: summary.overdueMilestonesCount })
                              : "—"}
                          </td>
                          <td>
                            <span className={riskClass(risk)}>{riskLabel}</span>
                          </td>
                          <td className="text-xs max-w-[120px] truncate" title={control?.primaryReason ?? ""}>
                            {control?.primaryReason ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-[var(--canon-border-glass)] px-4 py-3">
              <Link href="/dashboard/projects" className="text-sm font-medium text-[var(--canon-cyan)] hover:underline">
                {t("showAllProjects", { count: projects.length })} →
              </Link>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="canon-glass p-4">
              <h2 className="canon-section-title">{t("requiresAttention")}</h2>
              <ul className="mt-4 space-y-3">
                {attentionItems.length === 0 ? (
                  <li className="text-sm text-[var(--canon-text-muted)]">{t("noAttentionItems")}</li>
                ) : (
                  attentionItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-sm">
                      <span className={riskClass(item.level)}>{item.level === "high" ? t("riskHigh") : t("riskMedium")}</span>
                      <div>
                        <Link href={item.href} className="font-medium text-[var(--canon-text-primary)] hover:text-[var(--canon-gold)]">
                          {item.title}
                        </Link>
                        <p className="text-xs text-[var(--canon-text-muted)]">{item.project}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <Link href="/dashboard/tasks" className="mt-4 text-sm text-[var(--canon-cyan)] hover:underline">
                {t("allTasksLink")} →
              </Link>
            </section>

            <section className="canon-glass p-4">
              <h2 className="canon-section-title">{t("latestActivity")}</h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--canon-text-secondary)]">
                {activityItems.length === 0 ? (
                  <li className="text-[var(--canon-text-muted)]">{t("noActivityYet")}</li>
                ) : (
                  activityItems.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      {item.icon === "building" ? (
                        <Building2 size={16} className="shrink-0 text-[var(--canon-cyan)]" aria-hidden />
                      ) : (
                        <FolderKanban size={16} className="shrink-0 text-[var(--canon-success)]" aria-hidden />
                      )}
                      {item.href ? (
                        <Link href={item.href} className="hover:text-[var(--canon-cyan)]">{item.text}</Link>
                      ) : (
                        <span>{item.text}</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
              <Link href="/dashboard/reports" className="mt-4 text-sm text-[var(--canon-cyan)] hover:underline">
                {t("allActivityLink")} →
              </Link>
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="canon-glass canon-ai-panel p-4">
            <p className="canon-section-title">{t("aiAssistantTitle")}</p>
            <p className="mt-2 text-sm text-[var(--canon-text-secondary)]">{t("aiTodayRecommendations")}</p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--canon-text-secondary)]">
              {highRiskCount > 0 ? (
                <li>{t("aiInsightHighRisk", { count: highRiskCount })}</li>
              ) : (
                <li>{t("aiRecHealthy")}</li>
              )}
              {(ops?.queues.aiFailed?.length ?? 0) > 0 ? (
                <li>{t("aiRecFailedCount", { count: ops?.queues.aiFailed?.length ?? 0 })}</li>
              ) : null}
            </ul>
            <Link href="/dashboard/ai" className="canon-ai-panel-btn mt-4">
              {t("openAiCenter")} →
            </Link>
          </div>
          <CanonPortfolioAiPanel projectCount={projects.length} highRiskCount={highRiskCount} />
        </aside>
      </div>
    </div>
  );
}
