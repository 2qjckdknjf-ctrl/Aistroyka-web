"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CanonPageHeader,
  CanonPortfolioAiPanel,
  getCanonProjectGradient,
} from "@/components/canon";
import {
  fetchPortfolioControl,
  fetchProjectSummary,
  portfolioStateToRisk,
  taskProgressPct,
} from "@/components/canon/canon-live-data";
import { useProjects } from "@/lib/projects/useProjects";
import { usePrefetchProject } from "@/lib/projects/prefetchProject";

type TabKey = "all" | "active" | "paused" | "completed";

function riskClass(level: "high" | "medium" | "low") {
  return `canon-risk-badge ${level === "high" ? "canon-risk-badge--high" : level === "medium" ? "canon-risk-badge--medium" : "canon-risk-badge--low"}`;
}

export function DashboardProjectsCanonGrid() {
  const t = useTranslations("canon");
  const tNav = useTranslations("nav");
  const [tab, setTab] = useState<TabKey>("all");
  const projectsQuery = useProjects();
  const prefetchProject = usePrefetchProject();
  const portfolioQuery = useQuery({
    queryKey: ["portfolio-control"],
    queryFn: fetchPortfolioControl,
    staleTime: 60_000,
  });

  const projects = projectsQuery.data ?? [];
  const controlById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof portfolioQuery.data>["projects"][number]>();
    for (const row of portfolioQuery.data?.projects ?? []) {
      map.set(row.id, row);
    }
    return map;
  }, [portfolioQuery.data]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const control = controlById.get(p.id);
      const state = control?.portfolioState ?? "healthy";
      if (tab === "all") return true;
      if (tab === "active") return state !== "critical";
      if (tab === "paused") return state === "attention";
      if (tab === "completed") return state === "healthy";
      return true;
    });
  }, [projects, controlById, tab]);

  const visible = filtered.slice(0, 6);
  const summaryQueries = useQueries({
    queries: visible.map((p) => ({
      queryKey: ["project-summary", p.id],
      queryFn: () => fetchProjectSummary(p.id),
      staleTime: 60_000,
    })),
  });

  const highRiskCount =
    portfolioQuery.data?.distribution.critical ?? 0;

  const tabCounts = useMemo(() => {
    let active = 0;
    let paused = 0;
    let completed = 0;
    for (const p of projects) {
      const state = controlById.get(p.id)?.portfolioState ?? "healthy";
      if (state !== "critical") active += 1;
      if (state === "attention") paused += 1;
      if (state === "healthy") completed += 1;
    }
    return { all: projects.length, active, paused, completed };
  }, [projects, controlById]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: t("tabAllProjects", { count: tabCounts.all }) },
    { key: "active", label: t("tabInProgress", { count: tabCounts.active }) },
    { key: "paused", label: t("tabPaused", { count: tabCounts.paused }) },
    { key: "completed", label: t("tabCompleted", { count: tabCounts.completed }) },
  ];

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tNav("projects")}
        subtitle={t("screen02Label")}
        actions={
          <>
            <div className="flex rounded-lg border border-[var(--canon-border-glass)] p-0.5">
              <button type="button" className="canon-notify-btn !w-9" aria-label={t("viewGrid")}>
                <LayoutGrid size={18} aria-hidden />
              </button>
              <button
                type="button"
                className="canon-notify-btn !w-9 text-[var(--canon-gold)]"
                aria-label={t("viewList")}
              >
                <List size={18} aria-hidden />
              </button>
            </div>
            <button type="button" className="canon-ghost-btn">{t("sortByUpdate")} ▾</button>
            <Link href="/projects/new" className="canon-gold-btn">
              <Plus size={18} aria-hidden />
              {t("createProject")}
            </Link>
          </>
        }
      />

      <p className="text-sm text-[var(--canon-text-secondary)]">{t("projectsCatalogSubtitle")}</p>

      <div className="flex flex-wrap gap-2 border-b border-[var(--canon-border-glass)] pb-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? "text-[var(--canon-gold)] border-b-2 border-[var(--canon-gold)]"
                : "text-[var(--canon-text-muted)] hover:text-[var(--canon-text-primary)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="canon-glass overflow-hidden">
          {projectsQuery.isPending ? (
            <div className="p-12 text-center text-[var(--canon-text-muted)]">{t("loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Link href="/projects/new" className="canon-gold-btn inline-flex">
                <Plus size={18} aria-hidden />
                {t("addProject")}
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
                    <th>{t("colStage")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p, idx) => {
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
                            href={`/dashboard/projects/${p.id}`}
                            onMouseEnter={() => prefetchProject(p.id)}
                            className="flex items-center gap-3 group min-w-[200px]"
                          >
                            <span
                              className="h-11 w-11 shrink-0 rounded-lg"
                              style={{ background: getCanonProjectGradient(p.id) }}
                              aria-hidden
                            />
                            <span>
                              <span className="block font-medium text-[var(--canon-text-primary)] group-hover:text-[var(--canon-gold)]">
                                {p.name}
                              </span>
                              <span className="text-xs text-[var(--canon-text-muted)]">
                                {control?.projectStatus ?? "—"}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <div className="canon-progress-track max-w-[100px]">
                            <div className="canon-progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{progress}%</span>
                        </td>
                        <td className="text-xs max-w-[120px] truncate" title={budgetLabel}>{budgetLabel}</td>
                        <td className="text-xs">
                          {summary && summary.overdueMilestonesCount > 0
                            ? t("milestonesOverdue", { count: summary.overdueMilestonesCount })
                            : "—"}
                        </td>
                        <td>
                          <span className={riskClass(risk)}>{riskLabel}</span>
                        </td>
                        <td className="text-xs">—</td>
                        <td className="text-xs max-w-[140px] truncate" title={control?.primaryReason ?? ""}>
                          {control?.primaryReason ?? "—"}
                        </td>
                        <td>
                          <Link
                            href={`/dashboard/projects/${p.id}`}
                            className="text-[var(--canon-cyan)] hover:underline text-xs"
                          >
                            {t("openProject")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[var(--canon-border-glass)] px-4 py-3 text-xs text-[var(--canon-text-muted)]">
            <span>
              {t("paginationDemo", {
                from: filtered.length ? 1 : 0,
                to: Math.min(6, filtered.length),
                total: filtered.length,
              })}
            </span>
            <span>{t("perPage", { count: 6 })}</span>
          </div>
        </section>

        <CanonPortfolioAiPanel projectCount={projects.length} highRiskCount={highRiskCount} />
      </div>
    </div>
  );
}
