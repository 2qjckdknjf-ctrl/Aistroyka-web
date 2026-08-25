"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  ImageIcon,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CanonProgressRing } from "./CanonProgressRing";
import { getCanonProjectGradient } from "./canon-project-visual";
import {
  fetchProjectIntelligenceSlice,
  fetchProjectMedia,
  fetchProjectMilestones,
  fetchProjectSummary,
  taskProgressPct,
} from "./canon-live-data";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
}

interface WorkerRow {
  user_id: string;
  role: string;
  status: string;
}

async function fetchProjectTasks(projectId: string): Promise<TaskRow[]> {
  const qs = new URLSearchParams({
    project_id: projectId,
    limit: "8",
    offset: "0",
  });
  const res = await fetch(`/api/v1/tasks?${qs}`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchProjectWorkers(projectId: string): Promise<WorkerRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/workers?limit=5`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

function priorityClass(status: string): string {
  if (status === "in_progress") return "canon-risk-badge canon-risk-badge--medium";
  if (status === "done") return "canon-risk-badge canon-risk-badge--low";
  return "canon-risk-badge canon-risk-badge--high";
}

function milestoneIconClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "done" || s === "completed") return "text-[var(--canon-success)]";
  if (s === "in_progress" || s === "active") return "text-[var(--canon-cyan)]";
  return "text-[var(--canon-text-muted)]";
}

export function ProjectCommandCenterOverview({
  projectId,
  projectName,
  summary,
}: {
  projectId: string;
  projectName: string;
  summary: { activeWorkers: number; openReports: number; aiAnalyses: number };
}) {
  const t = useTranslations("canon");
  const tasksQuery = useQuery({
    queryKey: ["project-tasks-preview", projectId],
    queryFn: () => fetchProjectTasks(projectId),
  });
  const workersQuery = useQuery({
    queryKey: ["project-workers-preview", projectId],
    queryFn: () => fetchProjectWorkers(projectId),
  });
  const detailSummaryQuery = useQuery({
    queryKey: ["project-summary", projectId],
    queryFn: () => fetchProjectSummary(projectId),
    staleTime: 60_000,
  });
  const milestonesQuery = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchProjectMilestones(projectId),
    staleTime: 60_000,
  });
  const mediaQuery = useQuery({
    queryKey: ["project-media-preview", projectId],
    queryFn: () => fetchProjectMedia(projectId, 1),
    staleTime: 60_000,
  });
  const intelligenceQuery = useQuery({
    queryKey: ["project-intelligence-slice", projectId],
    queryFn: () => fetchProjectIntelligenceSlice(projectId),
    staleTime: 60_000,
  });

  const tasks = tasksQuery.data ?? [];
  const workers = workersQuery.data ?? [];
  const openTasks = tasks.filter((task) => task.status !== "done" && task.status !== "cancelled");
  const detail = detailSummaryQuery.data;
  const progress = taskProgressPct(detail);
  const budgetPct =
    detail && detail.budgetPlannedTotal > 0
      ? Math.min(100, Math.round((detail.budgetActualTotal / detail.budgetPlannedTotal) * 100))
      : 0;
  const milestones = milestonesQuery.data ?? [];
  const heroMedia = mediaQuery.data?.[0];
  const risks = intelligenceQuery.data?.topRisks ?? [];
  const riskLevel =
    detail?.budgetOverBudget || (detail?.overdueMilestonesCount ?? 0) > 0
      ? "high"
      : detail?.budgetNearingLimit
        ? "medium"
        : "low";

  return (
    <div className="space-y-6 p-4 md:p-5">
      <div className="canon-glass grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4">
          <CanonProgressRing value={progress} size={72} stroke={6} />
          <div>
            <p className="canon-kpi-label">{t("projectReadiness")}</p>
            <p className="canon-kpi-value">{detail ? `${progress}%` : "—"}</p>
            <p className="text-xs text-[var(--canon-text-muted)]">
              {detail ? t("tasksDoneRatio", { done: detail.tasksDone, total: detail.tasksTotal }) : t("progressPending")}
            </p>
          </div>
        </div>
        <div>
          <p className="canon-kpi-label">{t("projectBudget")}</p>
          <p className="canon-kpi-value mt-1">
            {detail && detail.budgetPlannedTotal > 0
              ? `${detail.budgetActualTotal.toLocaleString()} / ${detail.budgetPlannedTotal.toLocaleString()} ${detail.budgetCurrency}`
              : "—"}
          </p>
          <div className="canon-progress-track mt-3 max-w-[180px]">
            <div className="canon-progress-fill" style={{ width: `${budgetPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-[var(--canon-text-muted)]">
            {detail && detail.budgetPlannedTotal > 0
              ? t("budgetUtilization", { pct: budgetPct })
              : t("budgetPending")}
          </p>
        </div>
        <div>
          <p className="canon-kpi-label">{t("projectDeadline")}</p>
          <p className="canon-kpi-value mt-1">
            {detail && detail.overdueMilestonesCount > 0
              ? t("milestonesOverdue", { count: detail.overdueMilestonesCount })
              : detail?.milestonesCount
                ? `${detail.milestonesCount}`
                : "—"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--canon-text-muted)]">
            <Calendar size={14} aria-hidden />
            {detail?.overdueMilestonesCount ? t("requiresAttention") : t("deadlinePending")}
          </p>
        </div>
        <div>
          <p className="canon-kpi-label">{t("projectDeviation")}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--canon-warning)]">
            {detail?.budgetVarianceAmount != null && detail.budgetPlannedTotal > 0
              ? `${detail.budgetVarianceAmount.toLocaleString()} ${detail.budgetCurrency}`
              : "—"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--canon-warning)]">
            <AlertTriangle size={14} aria-hidden />
            {detail?.budgetOverBudget ? t("riskHigh") : t("criticalPath")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="canon-glass p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="canon-section-title">{t("todayOnSite")}</h2>
            <span className="text-xs text-[var(--canon-text-muted)]">{openTasks.length}</span>
          </div>
          <ul className="mt-4 space-y-3">
            {tasksQuery.isPending ? (
              <li className="text-sm text-[var(--canon-text-muted)]">{t("loading")}</li>
            ) : openTasks.length === 0 ? (
              <li className="text-sm text-[var(--canon-text-muted)]">{t("noOpenTasks")}</li>
            ) : (
              openTasks.slice(0, 4).map((task) => (
                <li key={task.id} className="flex items-start gap-3 text-sm">
                  <Circle size={16} className="mt-0.5 shrink-0 text-[var(--canon-text-muted)]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/tasks?task=${task.id}`}
                      className="font-medium text-[var(--canon-text-primary)] hover:text-[var(--canon-gold)]"
                    >
                      {task.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={priorityClass(task.status)}>{task.status}</span>
                      {task.due_date ? (
                        <span className="text-xs text-[var(--canon-text-muted)]">{task.due_date}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          <Link
            href={`/dashboard/tasks?project_id=${encodeURIComponent(projectId)}&view=board`}
            className="mt-4 text-sm font-medium text-[var(--canon-cyan)] hover:underline"
          >
            {t("showAllTasks", { count: openTasks.length })} →
          </Link>
        </section>

        <section className="canon-glass p-4 lg:col-span-1">
          <h2 className="canon-section-title">{t("keyMilestones")}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {milestonesQuery.isPending ? (
              <li className="text-[var(--canon-text-muted)]">{t("loading")}</li>
            ) : milestones.length === 0 ? (
              <li className="text-[var(--canon-text-muted)]">{t("noMilestonesYet")}</li>
            ) : (
              milestones.slice(0, 3).map((m) => {
                const iconClass = milestoneIconClass(m.status);
                const isDone = m.status.toLowerCase() === "done" || m.status.toLowerCase() === "completed";
                return (
                  <li key={m.id} className={`flex items-center gap-2 ${iconClass}`}>
                    {isDone ? (
                      <CheckCircle2 size={16} aria-hidden />
                    ) : (
                      <Circle size={16} className={iconClass.includes("cyan") ? "fill-[var(--canon-cyan)]" : ""} aria-hidden />
                    )}
                    <span>{m.title}</span>
                  </li>
                );
              })
            )}
          </ul>
          <Link
            href={`/dashboard/projects/${projectId}?tab=schedule`}
            className="canon-ghost-btn mt-4 inline-flex"
          >
            {t("openSchedule")} →
          </Link>
        </section>

        <section className="canon-glass canon-ai-panel p-4 lg:col-span-1">
          <h2 className="canon-section-title">{t("projectAiRisks")}</h2>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`canon-risk-badge ${
                riskLevel === "high"
                  ? "canon-risk-badge--high"
                  : riskLevel === "medium"
                    ? "canon-risk-badge--medium"
                    : "canon-risk-badge--low"
              }`}
            >
              {riskLevel === "high" ? t("riskHigh") : riskLevel === "medium" ? t("riskMedium") : t("riskLow")}
            </span>
            <span className="text-sm text-[var(--canon-text-secondary)]">{t("projectRiskLevel")}</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--canon-text-secondary)]">
            {intelligenceQuery.isPending ? (
              <li>{t("loading")}</li>
            ) : risks.length === 0 ? (
              <li>{t("aiRecHealthy")}</li>
            ) : (
              risks.map((risk, i) => <li key={i}>{risk}</li>)
            )}
          </ul>
          <p className="mt-3 text-xs text-[var(--canon-text-muted)]">
            {t("aiAnalysesCount", { count: summary.aiAnalyses })}
          </p>
          <Link href={`/dashboard/projects/${projectId}?tab=ai`} className="canon-ai-panel-btn mt-4">
            {t("openAiCenter")} →
          </Link>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <section className="canon-glass p-4">
          <h2 className="canon-section-title">{t("photoReport")}</h2>
          {heroMedia?.file_url ? (
            <img
              src={heroMedia.file_url}
              alt=""
              className="mt-3 aspect-video w-full rounded-xl border border-[var(--canon-border-glass)] object-cover"
            />
          ) : (
            <div
              className="mt-3 flex aspect-video items-center justify-center rounded-xl border border-dashed border-[var(--canon-border-glass)]"
              style={{ background: getCanonProjectGradient(projectId) }}
            >
              <ImageIcon size={32} className="text-[var(--canon-text-muted)]" aria-hidden />
            </div>
          )}
          <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{projectName}</p>
          <Link
            href={`/dashboard/projects/${projectId}?tab=uploads`}
            className="mt-3 text-sm text-[var(--canon-cyan)] hover:underline"
          >
            {t("openPhotoReport")} →
          </Link>
        </section>

        <section className="canon-glass p-4">
          <h2 className="canon-section-title">{t("projectTeam")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {workersQuery.isPending ? (
              <li className="text-[var(--canon-text-muted)]">{t("loading")}</li>
            ) : workers.length === 0 ? (
              <li className="text-[var(--canon-text-muted)]">{t("noTeamYet")}</li>
            ) : (
              workers.map((w) => (
                <li key={w.user_id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/workers/${w.user_id}`}
                    className="truncate font-medium text-[var(--canon-text-primary)] hover:text-[var(--canon-gold)]"
                  >
                    {w.user_id.slice(0, 8)}…
                  </Link>
                  <span className="canon-risk-badge canon-risk-badge--low">{w.role}</span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-xs text-[var(--canon-text-muted)]">
            {t("activeWorkersCount", { count: summary.activeWorkers })}
          </p>
          <Link
            href={`/dashboard/projects/${projectId}?tab=workers`}
            className="mt-2 text-sm text-[var(--canon-cyan)] hover:underline"
          >
            {t("allTeamMembers")} →
          </Link>
        </section>

        <section className="canon-glass p-4">
          <h2 className="canon-section-title">{t("recentDecisions")}</h2>
          {detail && detail.pendingDecisionsCount > 0 ? (
            <p className="mt-4 text-sm text-[var(--canon-text-secondary)]">
              {t("decisionsPending", { count: detail.pendingDecisionsCount })}
            </p>
          ) : (
            <p className="mt-4 text-sm text-[var(--canon-text-muted)]">{t("noDecisionsPending")}</p>
          )}
          <Link
            href={`/dashboard/projects/${projectId}?tab=decisions`}
            className="mt-4 text-sm text-[var(--canon-cyan)] hover:underline"
          >
            {t("allDecisions")} →
          </Link>
        </section>

        <section className="canon-glass p-4">
          <div className="flex items-center justify-between">
            <h2 className="canon-section-title">{t("costDynamics")}</h2>
            <TrendingUp size={18} className="text-[var(--canon-cyan)]" aria-hidden />
          </div>
          <div className="mt-4 h-24 rounded-lg bg-[linear-gradient(180deg,rgba(0,212,255,0.12),transparent)] flex items-end gap-1 px-2 pb-2">
            {detail && detail.budgetPlannedTotal > 0 ? (
              <>
                <div
                  className="flex-1 rounded-t bg-[var(--canon-text-muted)] opacity-50"
                  style={{ height: "100%" }}
                  title={t("reportPlannedVolume")}
                  aria-hidden
                />
                <div
                  className="flex-1 rounded-t bg-[var(--canon-cyan)] opacity-80"
                  style={{ height: `${budgetPct}%` }}
                  title={t("reportActualVolume")}
                  aria-hidden
                />
              </>
            ) : (
              [40, 55, 48, 62, 58, 70, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-[var(--canon-cyan)] opacity-30"
                  style={{ height: `${h}%` }}
                  aria-hidden
                />
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--canon-text-muted)]">
            {detail && detail.budgetPlannedTotal > 0
              ? t("budgetUtilization", { pct: budgetPct })
              : t("budgetPending")}
          </p>
          <Link
            href={`/dashboard/projects/${projectId}?tab=costs`}
            className="mt-3 text-sm text-[var(--canon-cyan)] hover:underline"
          >
            {t("openFinanceReport")} →
          </Link>
        </section>
      </div>
    </div>
  );
}
