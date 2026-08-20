"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/ui";
import {
  filterOpsQueuesForPhoneDensity,
  opsQueueItemCount,
  partitionOpsKpisForPhoneDensity,
  sortOpsQueuesByPhoneDensity,
  type OpsQueueDensityId,
} from "./ops-overview-density.utils";

interface OpsOverviewKpis {
  activeProjects: number;
  activeWorkersToday: number;
  reportsToday: number;
  stuckUploads: number;
  offlineDevices: number;
  failedJobs24h: number;
  tasks_assigned_today?: number;
  tasks_completed_today?: number;
  tasks_open_today?: number;
  tasks_overdue?: number;
}

interface OpsOverviewQueues {
  reportsPendingReview: { id: string; status: string; created_at: string }[];
  stuckUploads: { id: string; status: string; created_at: string }[];
  workersOpenShift: { user_id: string; day_date: string }[];
  workersOpenShiftNoReportToday?: { user_id: string; day_date: string }[];
  pushFailed: { id: string; attempts: number }[];
  aiFailed?: { id: string; status: string; created_at: string }[];
  tasksOpenToday?: { id: string; title: string; due_date: string }[];
  tasksOverdue?: { id: string; title: string; due_date: string }[];
}

interface OpsOverview {
  kpis: OpsOverviewKpis;
  queues: OpsOverviewQueues;
}

async function fetchOpsOverview(): Promise<OpsOverview> {
  const res = await fetch("/api/v1/ops/overview?limit=10", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load operations overview");
  }
  return res.json();
}

type KpiLabelKey =
  | "kpiActiveProjects"
  | "kpiActiveWorkersToday"
  | "kpiReportsToday"
  | "kpiStuckUploads"
  | "kpiOfflineDevices"
  | "kpiFailedJobs"
  | "kpiTasksAssignedToday"
  | "kpiTasksCompletedToday"
  | "kpiTasksOpenToday"
  | "kpiTasksOverdue";

type KpiCard = {
  labelKey: KpiLabelKey;
  value: number;
  borderClass: string;
  href?: string;
};

function KpiCardView({
  card,
  label,
}: {
  card: KpiCard;
  label: string;
}) {
  return (
    <DashboardGlassCard className={`border-l-4 ${card.borderClass}`}>
      <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
        {label}
      </p>
      {card.href ? (
        <Link
          href={card.href}
          className="mt-aistroyka-1 block text-aistroyka-title3 font-semibold text-aistroyka-accent hover:underline"
        >
          {card.value}
        </Link>
      ) : (
        <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
          {card.value}
        </p>
      )}
    </DashboardGlassCard>
  );
}

export function DashboardOpsOverviewClient() {
  const t = useTranslations("dashboard");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["ops-overview"],
    queryFn: fetchOpsOverview,
    staleTime: 60 * 1000,
  });

  const today = new Date().toISOString().slice(0, 10);

  const kpiCards: KpiCard[] = useMemo(() => {
    if (!data) return [];
    const { kpis } = data;
    return [
      { labelKey: "kpiActiveProjects", value: kpis.activeProjects, borderClass: "border-l-aistroyka-accent" },
      { labelKey: "kpiActiveWorkersToday", value: kpis.activeWorkersToday, borderClass: "border-l-aistroyka-info" },
      { labelKey: "kpiReportsToday", value: kpis.reportsToday, borderClass: "border-l-aistroyka-success" },
      { labelKey: "kpiStuckUploads", value: kpis.stuckUploads, borderClass: "border-l-aistroyka-warning" },
      { labelKey: "kpiOfflineDevices", value: kpis.offlineDevices, borderClass: "border-l-aistroyka-warning" },
      { labelKey: "kpiFailedJobs", value: kpis.failedJobs24h, borderClass: "border-l-aistroyka-error" },
      {
        labelKey: "kpiTasksAssignedToday",
        value: kpis.tasks_assigned_today ?? 0,
        borderClass: "border-l-aistroyka-info",
        href: "/dashboard/tasks",
      },
      {
        labelKey: "kpiTasksCompletedToday",
        value: kpis.tasks_completed_today ?? 0,
        borderClass: "border-l-aistroyka-success",
        href: `/dashboard/tasks?from=${today}&to=${today}&status=done`,
      },
      {
        labelKey: "kpiTasksOpenToday",
        value: kpis.tasks_open_today ?? 0,
        borderClass: "border-l-aistroyka-warning",
        href: `/dashboard/tasks?from=${today}&to=${today}`,
      },
      {
        labelKey: "kpiTasksOverdue",
        value: kpis.tasks_overdue ?? 0,
        borderClass: "border-l-aistroyka-error",
        href: "/dashboard/tasks?status=pending",
      },
    ];
  }, [data, today]);

  const { primary: phonePrimaryKpis, secondary: phoneSecondaryKpis } = useMemo(
    () => partitionOpsKpisForPhoneDensity(kpiCards),
    [kpiCards],
  );

  type QueueCard = {
    id: OpsQueueDensityId;
    count: number;
    titleKey:
      | "queueReportsReview"
      | "queueStuckUploads"
      | "queueWorkersOpenShift"
      | "queueOpenShiftNoReport"
      | "queueAiFailures"
      | "queueTasksOpenToday"
      | "queueTasksOverdue"
      | "queuePushFailures";
    viewAllHref: string;
    renderItems: () => ReactNode;
  };

  const queueCards: QueueCard[] = useMemo(() => {
    if (!data) return [];
    const { queues } = data;
    return [
      {
        id: "reportsPendingReview",
        count: opsQueueItemCount(queues.reportsPendingReview),
        titleKey: "queueReportsReview",
        viewAllHref: "/dashboard/approvals",
        renderItems: () =>
          queues.reportsPendingReview.length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            queues.reportsPendingReview.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/reports/${r.id}`}
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {r.id.slice(0, 8)}…
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "stuckUploads",
        count: opsQueueItemCount(queues.stuckUploads),
        titleKey: "queueStuckUploads",
        viewAllHref: "/dashboard/uploads?stuck=1",
        renderItems: () =>
          queues.stuckUploads.length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            queues.stuckUploads.slice(0, 5).map((u) => (
              <li key={u.id}>
                <Link
                  href="/dashboard/uploads"
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {u.id.slice(0, 8)}…
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "workersOpenShift",
        count: opsQueueItemCount(queues.workersOpenShift),
        titleKey: "queueWorkersOpenShift",
        viewAllHref: "/dashboard/workers",
        renderItems: () =>
          queues.workersOpenShift.length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            queues.workersOpenShift.slice(0, 5).map((w) => (
              <li key={`${w.user_id}-${w.day_date}`}>
                <Link
                  href={`/dashboard/workers/${w.user_id}`}
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {w.user_id.slice(0, 8)}… ({w.day_date})
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "workersOpenShiftNoReportToday",
        count: opsQueueItemCount(queues.workersOpenShiftNoReportToday),
        titleKey: "queueOpenShiftNoReport",
        viewAllHref: "/dashboard/workers",
        renderItems: () =>
          (queues.workersOpenShiftNoReportToday ?? []).length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            (queues.workersOpenShiftNoReportToday ?? []).slice(0, 5).map((w) => (
              <li key={`${w.user_id}-${w.day_date}`}>
                <Link
                  href={`/dashboard/workers/${w.user_id}`}
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {w.user_id.slice(0, 8)}… ({w.day_date})
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "aiFailed",
        count: opsQueueItemCount(queues.aiFailed),
        titleKey: "queueAiFailures",
        viewAllHref: "/dashboard/ai?status=failed",
        renderItems: () =>
          (queues.aiFailed ?? []).length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            (queues.aiFailed ?? []).slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link
                  href="/dashboard/ai?status=failed"
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {a.id.slice(0, 8)}… ({a.status})
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "tasksOpenToday",
        count: opsQueueItemCount(queues.tasksOpenToday),
        titleKey: "queueTasksOpenToday",
        viewAllHref: `/dashboard/tasks?from=${today}&to=${today}`,
        renderItems: () =>
          (queues.tasksOpenToday ?? []).length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            (queues.tasksOpenToday ?? []).slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {task.title.slice(0, 30)}
                  {task.title.length > 30 ? "…" : ""}
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "tasksOverdue",
        count: opsQueueItemCount(queues.tasksOverdue),
        titleKey: "queueTasksOverdue",
        viewAllHref: "/dashboard/tasks?status=pending",
        renderItems: () =>
          (queues.tasksOverdue ?? []).length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            (queues.tasksOverdue ?? []).slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {task.title.slice(0, 30)}
                  {task.title.length > 30 ? "…" : ""} ({task.due_date})
                </Link>
              </li>
            ))
          ),
      },
      {
        id: "pushFailed",
        count: opsQueueItemCount(queues.pushFailed),
        titleKey: "queuePushFailures",
        viewAllHref: "/admin/push?status=failed",
        renderItems: () =>
          queues.pushFailed.length === 0 ? (
            <li className="text-aistroyka-subheadline text-aistroyka-text-tertiary">—</li>
          ) : (
            queues.pushFailed.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href="/admin/push?status=failed"
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {p.id.slice(0, 8)}… ({p.attempts})
                </Link>
              </li>
            ))
          ),
      },
    ];
  }, [data, today]);

  const sortedQueues = useMemo(() => sortOpsQueuesByPhoneDensity(queueCards), [queueCards]);
  const phoneQueues = useMemo(
    () => filterOpsQueuesForPhoneDensity(sortedQueues, { phone: true }),
    [sortedQueues],
  );

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : t("opsError")}
        onRetry={() => refetch()}
      />
    );
  }

  if (isPending || !data) {
    return (
      <section
        className="mb-aistroyka-6 grid grid-cols-2 gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-6"
        aria-label={t("kpiOverviewAria")}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <DashboardGlassCard key={i}>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </DashboardGlassCard>
        ))}
      </section>
    );
  }

  return (
    <>
      {/* Phone: attention-first KPI density */}
      <section
        className="mb-aistroyka-4 grid grid-cols-2 gap-aistroyka-3 sm:hidden"
        aria-label={t("kpiOverviewAria")}
      >
        {phonePrimaryKpis.map((card) => (
          <KpiCardView key={card.labelKey} card={card} label={t(card.labelKey)} />
        ))}
      </section>
      {phoneSecondaryKpis.length > 0 ? (
        <details className="mb-aistroyka-6 sm:hidden">
          <summary className="cursor-pointer text-aistroyka-subheadline font-medium text-aistroyka-accent">
            {t("opsMoreMetrics")}
          </summary>
          <div className="mt-aistroyka-3 grid grid-cols-2 gap-aistroyka-3">
            {phoneSecondaryKpis.map((card) => (
              <KpiCardView key={card.labelKey} card={card} label={t(card.labelKey)} />
            ))}
          </div>
        </details>
      ) : null}

      {/* Tablet/desktop: full KPI grid */}
      <section
        className="mb-aistroyka-6 hidden gap-aistroyka-4 sm:grid sm:grid-cols-2 lg:grid-cols-6"
        aria-label={t("kpiOverviewAria")}
      >
        {kpiCards.map((card) => (
          <KpiCardView key={card.labelKey} card={card} label={t(card.labelKey)} />
        ))}
      </section>

      {/* Phone: non-empty queues only, urgency-sorted */}
      <section className="mb-aistroyka-4 grid gap-aistroyka-3 sm:hidden" aria-label={t("queuesAria")}>
        {phoneQueues.length === 0 ? (
          <DashboardGlassCard>
            <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
              {t("opsQueuesAllClear")}
            </p>
          </DashboardGlassCard>
        ) : (
          phoneQueues.map((queue) => (
            <DashboardGlassCard key={queue.id}>
              <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
                {t(queue.titleKey)}
                <span className="ml-2 tabular-nums text-aistroyka-caption font-normal text-aistroyka-text-tertiary">
                  ({queue.count})
                </span>
              </h3>
              <ul className="mt-2 space-y-1">{queue.renderItems()}</ul>
              <Link
                href={queue.viewAllHref}
                className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
              >
                {t("viewAll")} →
              </Link>
            </DashboardGlassCard>
          ))
        )}
      </section>

      {/* Tablet/desktop: full queue status grid (empties visible) */}
      <section
        className="hidden gap-aistroyka-4 sm:grid sm:grid-cols-2 lg:grid-cols-3"
        aria-label={t("queuesAria")}
      >
        {sortedQueues.map((queue) => (
          <DashboardGlassCard
            key={queue.id}
            className={queue.id === "pushFailed" ? "sm:col-span-2 lg:col-span-1" : undefined}
          >
            <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
              {t(queue.titleKey)}
            </h3>
            <ul className="mt-2 space-y-1">{queue.renderItems()}</ul>
            <Link
              href={queue.viewAllHref}
              className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
            >
              {t("viewAll")} →
            </Link>
          </DashboardGlassCard>
        ))}
      </section>
    </>
  );
}
