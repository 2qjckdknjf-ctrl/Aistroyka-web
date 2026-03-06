"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/ui";

interface OpsOverviewKpis {
  activeProjects: number;
  activeWorkersToday: number;
  reportsToday: number;
  stuckUploads: number;
  offlineDevices: number;
  failedJobs24h: number;
}

interface OpsOverviewQueues {
  reportsPendingReview: { id: string; status: string; created_at: string }[];
  stuckUploads: { id: string; status: string; created_at: string }[];
  workersOpenShift: { user_id: string; day_date: string }[];
  pushFailed: { id: string; attempts: number }[];
  aiFailed?: { id: string; status: string; created_at: string }[];
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

export function DashboardOpsOverviewClient() {
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
      <section className="mb-aistroyka-6 grid gap-aistroyka-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="KPI overview">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-aistroyka-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
          </Card>
        ))}
      </section>
    );
  }

  const { kpis, queues } = data;
  const kpiCards: { label: string; value: number; borderClass: string }[] = [
    { label: t("kpiActiveProjects"), value: kpis.activeProjects, borderClass: "border-l-aistroyka-accent" },
    { label: t("kpiActiveWorkersToday"), value: kpis.activeWorkersToday, borderClass: "border-l-aistroyka-info" },
    { label: t("kpiReportsToday"), value: kpis.reportsToday, borderClass: "border-l-aistroyka-success" },
    { label: t("kpiStuckUploads"), value: kpis.stuckUploads, borderClass: "border-l-aistroyka-warning" },
    { label: t("kpiOfflineDevices"), value: kpis.offlineDevices, borderClass: "border-l-aistroyka-warning" },
    { label: t("kpiFailedJobs"), value: kpis.failedJobs24h, borderClass: "border-l-aistroyka-error" },
  ];

  return (
    <>
      <section
        className="mb-aistroyka-6 grid gap-aistroyka-4 sm:grid-cols-2 lg:grid-cols-6"
        aria-label="KPI overview"
      >
        {kpiCards.map(({ label, value, borderClass }) => (
          <Card key={label} className={`border-l-4 ${borderClass}`}>
            <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
              {label}
            </p>
            <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
              {value}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-aistroyka-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Queues">
        <Card className="p-aistroyka-4">
          <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {t("queueReportsReview")}
          </h3>
          <ul className="mt-2 space-y-1">
            {queues.reportsPendingReview.length === 0 ? (
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
            )}
          </ul>
          <Link
            href="/dashboard/reports?status=submitted"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </Card>

        <Card className="p-aistroyka-4">
          <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {t("queueStuckUploads")}
          </h3>
          <ul className="mt-2 space-y-1">
            {queues.stuckUploads.length === 0 ? (
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
            )}
          </ul>
          <Link
            href="/dashboard/uploads?stuck=1"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </Card>

        <Card className="p-aistroyka-4">
          <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {t("queueWorkersOpenShift")}
          </h3>
          <ul className="mt-2 space-y-1">
            {queues.workersOpenShift.length === 0 ? (
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
            )}
          </ul>
          <Link
            href="/dashboard/workers"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </Card>

        <Card className="p-aistroyka-4">
          <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {t("queueAiFailures")}
          </h3>
          <ul className="mt-2 space-y-1">
            {(queues.aiFailed ?? []).length === 0 ? (
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
            )}
          </ul>
          <Link
            href="/dashboard/ai?status=failed"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </Card>

        <Card className="p-aistroyka-4 sm:col-span-2 lg:col-span-1">
          <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {t("queuePushFailures")}
          </h3>
          <ul className="mt-2 space-y-1">
            {queues.pushFailed.length === 0 ? (
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
            )}
          </ul>
          <Link
            href="/admin/push?status=failed"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </Card>
      </section>
    </>
  );
}
