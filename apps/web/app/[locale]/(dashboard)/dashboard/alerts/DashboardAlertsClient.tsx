"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { AlertFeed, type AlertItemData } from "@/components/intelligence";
import { Skeleton, ErrorState } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import {
  countAlertsBySeverity,
  countAlertsByStatus,
  filterAlertsBySeverity,
  filterAlertsByStatus,
  parseAlertSeverityFilter,
  parseAlertStatusFilter,
  sortAlertsByAttention,
  type AlertSeverityFilter,
  type AlertStatusFilter,
} from "./alerts-workspace.utils";

async function fetchAlerts(): Promise<AlertItemData[]> {
  const res = await fetch(`/api/v1/alerts?limit=50&unresolved=false`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load alerts");
  }
  const json = await res.json();
  return json.data ?? [];
}

export function DashboardAlertsClient() {
  const t = useTranslations("dashboard");
  const tDetail = useTranslations("dashboardDetail");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const statusFilter = parseAlertStatusFilter(searchParams?.get("status"));
  const severityFilter = parseAlertSeverityFilter(searchParams?.get("severity"));

  const { data, isPending, isError, isSuccess, error, refetch } = useQuery({
    queryKey: ["dashboard-alerts-full"],
    queryFn: fetchAlerts,
    staleTime: 60 * 1000,
  });
  const scrolledRef = useRef(false);

  const setQueryParam = useCallback(
    (key: "status" | "severity", value: string | null) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (!value || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const sorted = useMemo(() => sortAlertsByAttention(data ?? []), [data]);
  const statusCounts = useMemo(() => countAlertsByStatus(sorted), [sorted]);
  const severityCounts = useMemo(() => countAlertsBySeverity(sorted), [sorted]);
  const visible = useMemo(() => {
    const byStatus = filterAlertsByStatus(sorted, statusFilter);
    return filterAlertsBySeverity(byStatus, severityFilter);
  }, [sorted, statusFilter, severityFilter]);

  useEffect(() => {
    if (!isSuccess || !visible.length) return;
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
        }, ms),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [isSuccess, visible]);

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : t("failedLoadAlerts")}
        onRetry={() => refetch()}
      />
    );
  }

  const statusChips: Array<{ id: AlertStatusFilter; label: string }> = [
    { id: "all", label: t("alertsFilterAll") },
    { id: "unresolved", label: t("alertsFilterUnresolved") },
    { id: "resolved", label: t("alertsFilterResolved") },
  ];
  const severityChips: Array<{ id: AlertSeverityFilter; label: string }> = [
    { id: "all", label: t("alertsSeverityAll") },
    { id: "critical", label: t("alertsSeverityCritical") },
    { id: "warn", label: t("alertsSeverityWarn") },
    { id: "info", label: t("alertsSeverityInfo") },
  ];

  return (
    <>
      <header className="mb-6">
        <h1 className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary">
          {t("alertsPageTitle")}
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {t("alertsPageSubtitle")}
        </p>
      </header>

      <DashboardGlassCard contentClassName="space-y-3 p-4">
        <div
          role="group"
          aria-label={t("alertsStatusFilter")}
          className="flex flex-wrap gap-1"
        >
          {statusChips.map((chip) => {
            const pressed = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setQueryParam("status", chip.id === "all" ? null : chip.id)}
                className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-lg)] border px-3 text-aistroyka-caption font-medium ${
                  pressed
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                }`}
              >
                {chip.label}
                <span className="ml-1 tabular-nums text-aistroyka-text-tertiary">
                  ({statusCounts[chip.id]})
                </span>
              </button>
            );
          })}
        </div>
        <div
          role="group"
          aria-label={t("alertsSeverityFilter")}
          className="flex flex-wrap gap-1"
        >
          {severityChips.map((chip) => {
            const pressed = severityFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setQueryParam("severity", chip.id === "all" ? null : chip.id)}
                className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-lg)] border px-3 text-aistroyka-caption font-medium ${
                  pressed
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                }`}
              >
                {chip.label}
                <span className="ml-1 tabular-nums text-aistroyka-text-tertiary">
                  ({severityCounts[chip.id]})
                </span>
              </button>
            );
          })}
        </div>
      </DashboardGlassCard>

      <div className="mt-4">
        {isPending ? (
          <DashboardGlassCard>
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </DashboardGlassCard>
        ) : (
          <AlertFeed
            alerts={visible}
            emptyMessage={tDetail("alertsEmptyForFilter")}
            maxItems={null}
          />
        )}
      </div>
    </>
  );
}
