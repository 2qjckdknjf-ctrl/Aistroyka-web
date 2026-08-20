"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  Badge,
  Skeleton,
  ErrorState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui";
import type { WorkloadInboxResult, WorkloadItem } from "@/lib/domain/workload/workload.types";
import { formatWorkloadPriority, workloadPriorityBadgeClass } from "./statusBadgeStyles";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import {
  countWorkloadByPriority,
  filterWorkloadByPriority,
  parseWorkloadPriorityFilter,
  sortWorkloadByPriority,
  type WorkloadPriorityFilter,
} from "./workload-inbox.utils";

async function fetchWorkload(audience: "manager" | "leadership"): Promise<WorkloadInboxResult> {
  const res = await fetch(`/api/v1/workload?audience=${audience}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

function priBadge(p: string) {
  return <Badge className={workloadPriorityBadgeClass(p)}>{formatWorkloadPriority(p)}</Badge>;
}

export function WorkloadInboxClient() {
  const tDetail = useTranslations("dashboardDetail");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const priorityFilter = parseWorkloadPriorityFilter(searchParams?.get("priority"));

  const mgr = useQuery({
    queryKey: ["workload", "manager"],
    queryFn: () => fetchWorkload("manager"),
  });
  const lead = useQuery({
    queryKey: ["workload", "leadership"],
    queryFn: () => fetchWorkload("leadership"),
  });

  const setPriority = useCallback(
    (value: WorkloadPriorityFilter) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (value === "all") next.delete("priority");
      else next.set("priority", value);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const managerSource = useMemo(
    () => sortWorkloadByPriority(mgr.data?.items ?? []),
    [mgr.data?.items],
  );
  const leadershipSource = useMemo(
    () => sortWorkloadByPriority(lead.data?.items ?? []),
    [lead.data?.items],
  );
  const combinedCounts = useMemo(
    () => countWorkloadByPriority([...managerSource, ...leadershipSource]),
    [managerSource, leadershipSource],
  );
  const managerItems = useMemo(
    () => filterWorkloadByPriority(managerSource, priorityFilter),
    [managerSource, priorityFilter],
  );
  const leadershipItems = useMemo(
    () => filterWorkloadByPriority(leadershipSource, priorityFilter),
    [leadershipSource, priorityFilter],
  );

  const loading = mgr.isPending || lead.isPending;
  const err = mgr.error ?? lead.error;

  if (err) {
    return (
      <ErrorState
        message={err instanceof Error ? err.message : tDetail("failedLoadInbox")}
        onRetry={() => {
          mgr.refetch();
          lead.refetch();
        }}
      />
    );
  }

  if (loading) {
    return (
      <DashboardGlassCard className="p-4">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </DashboardGlassCard>
    );
  }

  const filterChips: Array<{ id: WorkloadPriorityFilter; label: string }> = [
    { id: "all", label: tDetail("all") },
    { id: "urgent", label: tDetail("urgent") },
    { id: "high", label: tDetail("high") },
    { id: "normal", label: tDetail("normal") },
  ];

  return (
    <div className="space-y-8">
      <DashboardGlassCard contentClassName="p-4">
        <div
          role="group"
          aria-label={tDetail("workloadPriorityFilter")}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-aistroyka-text-secondary">{tDetail("filter")}:</span>
          {filterChips.map((chip) => {
            const pressed = priorityFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={pressed}
                className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-lg)] border px-3 text-aistroyka-caption font-medium capitalize ${
                  pressed
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-tertiary hover:text-aistroyka-text-primary"
                }`}
                onClick={() => setPriority(chip.id)}
              >
                {chip.label}
                <span className="ml-1 tabular-nums text-aistroyka-text-tertiary">
                  ({combinedCounts[chip.id]})
                </span>
              </button>
            );
          })}
        </div>
      </DashboardGlassCard>

      <section aria-label={tDetail("managerExecutionInbox")}>
        <h2 className="mb-2 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
          {tDetail("executionInbox")}
        </h2>
        <p className="mb-3 text-sm text-aistroyka-text-secondary">{tDetail("executionInboxHint")}</p>
        <WorkloadList items={managerItems} empty={tDetail("nothingNeedsAttentionFilter")} tDetail={tDetail} />
      </section>

      {leadershipItems.length > 0 ? (
        <section aria-label={tDetail("leadershipPortfolioSignals")}>
          <h2 className="mb-2 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
            {tDetail("portfolioCritical")}
          </h2>
          <p className="mb-3 text-sm text-aistroyka-text-secondary">
            {tDetail("criticalPortfolioStateHint")}
          </p>
          <WorkloadList
            items={leadershipItems}
            empty={tDetail("noCriticalPortfolioProjects")}
            tDetail={tDetail}
          />
        </section>
      ) : null}
    </div>
  );
}

function WorkloadList({
  items,
  empty,
  tDetail,
}: {
  items: WorkloadItem[];
  empty: string;
  tDetail: ReturnType<typeof useTranslations>;
}) {
  if (items.length === 0) {
    return (
      <DashboardGlassCard contentClassName="p-4">
        <p className="text-sm text-aistroyka-text-tertiary">{empty}</p>
      </DashboardGlassCard>
    );
  }

  return (
    <>
      {/* Phone density cards */}
      <ul className="space-y-2 sm:hidden">
        {items.map((w) => (
          <li key={w.id}>
            <DashboardGlassCard contentClassName="space-y-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {priBadge(w.priority)}
                <Link
                  href={w.action_url}
                  className="text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  {tDetail("openArrow")}
                </Link>
              </div>
              <p className="font-medium text-aistroyka-text-primary">{w.title}</p>
              <p className="text-xs text-aistroyka-text-tertiary">{w.reason}</p>
              <p className="text-xs text-aistroyka-text-secondary">
                {w.project_name ?? "—"}
              </p>
            </DashboardGlassCard>
          </li>
        ))}
      </ul>

      {/* Tablet/desktop table */}
      <div className="hidden sm:block">
        <DashboardGlassCard contentClassName="overflow-hidden p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{tDetail("priority")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("item")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("project")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("action")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{priBadge(w.priority)}</TableCell>
                  <TableCell>
                    <p className="font-medium text-aistroyka-text-primary">{w.title}</p>
                    <p className="mt-0.5 text-xs text-aistroyka-text-tertiary">{w.reason}</p>
                  </TableCell>
                  <TableCell>{w.project_name ?? "—"}</TableCell>
                  <TableCell>
                    <Link
                      href={w.action_url}
                      className="text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      {tDetail("openArrow")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardGlassCard>
      </div>
    </>
  );
}
