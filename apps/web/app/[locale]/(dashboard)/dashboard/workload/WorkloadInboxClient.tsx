"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, ErrorState, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui";
import type { WorkloadInboxResult, WorkloadItem } from "@/lib/domain/workload/workload.types";
import { formatWorkloadPriority, workloadPriorityBadgeClass } from "./statusBadgeStyles";

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

function filterPri(items: WorkloadItem[], f: "all" | "urgent" | "high" | "normal") {
  if (f === "all") return items;
  return items.filter((i) => i.priority === f);
}

export function WorkloadInboxClient() {
  const tDetail = useTranslations("dashboardDetail");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "high" | "normal">("all");

  const mgr = useQuery({
    queryKey: ["workload", "manager"],
    queryFn: () => fetchWorkload("manager"),
  });
  const lead = useQuery({
    queryKey: ["workload", "leadership"],
    queryFn: () => fetchWorkload("leadership"),
  });

  const managerItems = useMemo(
    () => filterPri(mgr.data?.items ?? [], priorityFilter),
    [mgr.data?.items, priorityFilter]
  );
  const leadershipItems = useMemo(
    () => filterPri(lead.data?.items ?? [], priorityFilter),
    [lead.data?.items, priorityFilter]
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
      <Card className="p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-aistroyka-text-secondary">{tDetail("filter")}:</span>
        {(["all", "urgent", "high", "normal"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded px-2 py-1 capitalize ${priorityFilter === f ? "bg-aistroyka-surface-raised font-medium" : "text-aistroyka-text-tertiary"}`}
            onClick={() => setPriorityFilter(f)}
          >
            {tDetail(f)}
          </button>
        ))}
      </div>

      <section aria-label={tDetail("managerExecutionInbox")}>
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary mb-2">{tDetail("executionInbox")}</h2>
        <p className="text-sm text-aistroyka-text-secondary mb-3">
          {tDetail("executionInboxHint")}
        </p>
        <WorkloadTable items={managerItems} empty={tDetail("nothingNeedsAttentionFilter")} tDetail={tDetail} />
      </section>

      {leadershipItems.length > 0 ? (
        <section aria-label={tDetail("leadershipPortfolioSignals")}>
          <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary mb-2">{tDetail("portfolioCritical")}</h2>
          <p className="text-sm text-aistroyka-text-secondary mb-3">{tDetail("criticalPortfolioStateHint")}</p>
          <WorkloadTable items={leadershipItems} empty={tDetail("noCriticalPortfolioProjects")} tDetail={tDetail} />
        </section>
      ) : null}
    </div>
  );
}

function WorkloadTable({
  items,
  empty,
  tDetail,
}: {
  items: WorkloadItem[];
  empty: string;
  tDetail: ReturnType<typeof useTranslations>;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-aistroyka-text-tertiary">{empty}</p>;
  }
  return (
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
              <p className="text-xs text-aistroyka-text-tertiary mt-0.5">{w.reason}</p>
            </TableCell>
              <TableCell>{w.project_name ?? "—"}</TableCell>
            <TableCell>
              <Link href={w.action_url} className="text-aistroyka-accent hover:underline text-sm font-medium">
                  {tDetail("openArrow")}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
