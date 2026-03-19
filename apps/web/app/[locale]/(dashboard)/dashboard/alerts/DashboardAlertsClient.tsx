"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertFeed, type AlertItemData } from "@/components/intelligence";
import { Card, Skeleton, ErrorState } from "@/components/ui";

async function fetchAlerts(unresolvedOnly: boolean): Promise<AlertItemData[]> {
  const res = await fetch(
    `/api/v1/alerts?limit=50&unresolved=${unresolvedOnly}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load alerts");
  }
  const json = await res.json();
  return json.data ?? [];
}

export function DashboardAlertsClient() {
  const { data, isPending, isError, isSuccess, error, refetch } = useQuery({
    queryKey: ["dashboard-alerts-full"],
    queryFn: () => fetchAlerts(false),
    staleTime: 60 * 1000,
  });
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!isSuccess || !data?.length) return;
    if (scrolledRef.current) return;
    const delays = [0, 120, 350, 700];
    const timers: ReturnType<typeof setTimeout>[] = [];
    delays.forEach((ms) => {
      timers.push(
        setTimeout(() => {
          const hash = window.location.hash;
          if (!hash.startsWith("#alert-")) return;
          const el = document.getElementById(hash.slice(1));
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            scrolledRef.current = true;
          }
        }, ms)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [isSuccess, data]);

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Alerts unavailable"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary">
          Alerts
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Workflow, AI, and platform alerts for your tenant. Deep links use the list below — there is
          no per-alert project URL until the schema stores resource references.
        </p>
      </header>
      {isPending ? (
        <Card>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </Card>
      ) : (
        <AlertFeed alerts={data ?? []} emptyMessage="No alerts" />
      )}
    </>
  );
}
