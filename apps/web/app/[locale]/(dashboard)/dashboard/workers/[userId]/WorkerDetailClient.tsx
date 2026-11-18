"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

interface WorkerSummary {
  reports_count: number;
  media_count: number;
  is_contractor?: boolean;
  tasks_assigned?: number;
  tasks_overdue?: number;
  reports_pending_review?: number;
}

async function fetchWorkerSummary(userId: string): Promise<WorkerSummary> {
  const res = await fetch(`/api/v1/workers/${encodeURIComponent(userId)}/summary`, { credentials: "include" });
  if (!res.ok) return { reports_count: 0, media_count: 0 };
  const json = await res.json();
  return json.data ?? { reports_count: 0, media_count: 0 };
}

export function WorkerDetailClient({ userId }: { userId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const { data, isPending } = useQuery({
    queryKey: ["worker-summary", userId],
    queryFn: () => fetchWorkerSummary(userId),
    enabled: !!userId,
  });

  if (isPending) return <DashboardGlassCard className="p-4"><Skeleton lines={2} /></DashboardGlassCard>;
  const reports_count = data?.reports_count ?? 0;
  const media_count = data?.media_count ?? 0;
  const is_contractor = data?.is_contractor ?? false;
  const tasks_assigned = data?.tasks_assigned ?? 0;
  const tasks_overdue = data?.tasks_overdue ?? 0;
  const reports_pending_review = data?.reports_pending_review ?? 0;

  return (
    <DashboardGlassCard className="p-4">
      {is_contractor && (
        <p className="mb-3">
          <span className="inline-flex items-center rounded-full bg-aistroyka-surface px-2.5 py-0.5 text-aistroyka-caption font-medium text-aistroyka-accent ring-1 ring-aistroyka-border-subtle">
            {tDetail("contractor")}
          </span>
        </p>
      )}
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("reportsCreated")}</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{reports_count}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("mediaCount")}</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{media_count}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("tasksAssigned")}</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{tasks_assigned}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("tasksOverdue")}</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{tasks_overdue}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("reportsPendingReview")}</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{reports_pending_review}</dd>
        </div>
      </dl>
      <p className="mt-3 text-aistroyka-caption text-aistroyka-text-secondary">
        <Link href={`/dashboard/tasks?worker_id=${encodeURIComponent(userId)}`} className="text-aistroyka-accent hover:underline mr-2">{tDetail("tasksForWorkerLink")}</Link>
        · <Link href="/dashboard/daily-reports" className="text-aistroyka-accent hover:underline">{tDetail("viewAllReportsLink")}</Link> {tDetail("workerSubmissionsSuffix")}
      </p>
    </DashboardGlassCard>
  );
}
