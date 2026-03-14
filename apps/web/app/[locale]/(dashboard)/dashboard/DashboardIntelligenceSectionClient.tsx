"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { AlertFeed, type AlertItemData } from "@/components/intelligence";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { DashboardPriorityActionsClient } from "./DashboardPriorityActionsClient";

async function fetchAlerts(): Promise<AlertItemData[]> {
  const res = await fetch("/api/v1/alerts?limit=10", { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function DashboardIntelligenceSectionClient() {
  const { data: alerts, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: fetchAlerts,
    staleTime: 60 * 1000,
  });

  return (
    <section className="mt-8 space-y-4" aria-label="Intelligence and alerts">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Intelligence &amp; Alerts
        </h2>
        <Link
          href="/dashboard/projects"
          className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
        >
          Open a project → Intelligence tab
        </Link>
      </div>
      <DashboardPriorityActionsClient />
      <div className="grid gap-4 lg:grid-cols-2">
        {isError ? (
          <ErrorState message="Failed to load alerts" onRetry={() => refetch()} />
        ) : isPending ? (
          <Card>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </Card>
        ) : (
          <AlertFeed alerts={alerts ?? []} emptyMessage="No alerts" />
        )}
      </div>
    </section>
  );
}
