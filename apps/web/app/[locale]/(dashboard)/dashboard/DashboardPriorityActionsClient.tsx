"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { buildPriorityItems } from "@/lib/dashboard/priority-actions";

interface OpsOverview {
  kpis: {
    tasks_overdue?: number;
    tasks_open_today?: number;
    stuckUploads: number;
    failedJobs24h: number;
  };
  queues: {
    tasksOverdue?: { id: string; title: string; due_date: string }[];
    tasksOpenToday?: { id: string; title: string; due_date: string }[];
    reportsPendingReview: { id: string }[];
    workersOpenShiftNoReportToday?: { user_id: string; day_date: string }[];
    stuckUploads: { id: string }[];
    aiFailed?: { id: string }[];
  };
}

async function fetchOpsOverview(): Promise<OpsOverview> {
  const res = await fetch("/api/v1/ops/overview?limit=5", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

export function DashboardPriorityActionsClient() {
  const t = useTranslations("dashboard");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["ops-overview"],
    queryFn: fetchOpsOverview,
    staleTime: 60 * 1000,
  });

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
      <Card className="p-4">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </Card>
    );
  }

  const items = buildPriorityItems(data);

  return (
    <Card className="p-4" aria-label="Priority actions">
      <h3 className="text-base font-semibold text-aistroyka-text-primary">
        What needs attention
      </h3>
      {items.length === 0 ? (
        <>
          <p className="mt-2 text-sm text-aistroyka-text-secondary">
            Nothing urgent. Continue monitoring.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
          >
            View projects →
          </Link>
        </>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-md border-l-4 px-3 py-2 ${
                item.priority === "high"
                  ? "border-l-aistroyka-error bg-aistroyka-error/5"
                  : item.priority === "medium"
                    ? "border-l-amber-500 bg-amber-500/5"
                    : "border-l-aistroyka-info bg-aistroyka-info/5"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-aistroyka-text-primary">
                  {item.title}
                </span>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  Open →
                </Link>
              </div>
              <p className="mt-0.5 text-xs text-aistroyka-text-tertiary">
                {item.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
