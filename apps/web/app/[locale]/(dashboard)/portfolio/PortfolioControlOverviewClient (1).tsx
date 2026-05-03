"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, ErrorState, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui";
import type {
  PortfolioControlResult,
  PortfolioControlSignalCounts,
} from "@/lib/domain/portfolio/portfolio-control.types";
import { drilldownHrefForCategory } from "@/lib/domain/portfolio/portfolio-control.signals";
import { formatPortfolioStateLabel, portfolioStateBadgeClass } from "./portfolioStateStyles";

function SignalSummary({ signals }: { signals: PortfolioControlSignalCounts }) {
  const parts: string[] = [];
  if (signals.overdueMilestonesCount > 0) parts.push(`Δmilestones ${signals.overdueMilestonesCount}`);
  if (signals.pendingApprovalsCount > 0) parts.push(`approvals ${signals.pendingApprovalsCount}`);
  if (signals.pendingClientRequestsCount > 0) parts.push(`client req ${signals.pendingClientRequestsCount}`);
  if (signals.openChangeOrdersCount > 0) parts.push(`CO ${signals.openChangeOrdersCount}`);
  if (signals.openDiscussionsCount > 0) parts.push(`disc ${signals.openDiscussionsCount}`);
  if (signals.pendingReportApprovalsCount > 0) parts.push(`reports ${signals.pendingReportApprovalsCount}`);
  if (signals.openIssuesCount > 0) parts.push(`issues ${signals.openIssuesCount}`);
  if (signals.blockingDefectsCount > 0) parts.push(`punch ${signals.blockingDefectsCount}`);
  if (signals.activeAftercareCount > 0) parts.push(`aftercare ${signals.activeAftercareCount}`);
  if (signals.handoverBlockerCount > 0) parts.push(`handover ${signals.handoverBlockerCount}`);
  if (signals.budgetOverBudget) parts.push("over budget");
  else if (signals.budgetNearingLimit) parts.push("budget pressure");
  if (parts.length === 0) return <span className="text-xs text-aistroyka-text-tertiary">—</span>;
  return <p className="text-xs text-aistroyka-text-secondary max-w-[14rem]">{parts.join(" · ")}</p>;
}

async function fetchPortfolioControl(): Promise<PortfolioControlResult> {
  const res = await fetch("/api/v1/portfolio/control", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load portfolio control");
  }
  const json = await res.json();
  return json.data;
}

function categoryLabel(c: string): string {
  if (c === "none") return "—";
  return c.replace(/_/g, " ");
}

export function PortfolioControlOverviewClient() {
  const [filter, setFilter] = useState<"all" | "healthy" | "attention" | "critical">("all");
  const q = useQuery({
    queryKey: ["portfolio-control"],
    queryFn: fetchPortfolioControl,
    staleTime: 45 * 1000,
  });

  const rows = useMemo(() => {
    const list = q.data?.projects ?? [];
    if (filter === "all") return list;
    return list.filter((p) => p.portfolioState === filter);
  }, [q.data?.projects, filter]);

  if (q.isError) {
    return (
      <ErrorState
        message={q.error instanceof Error ? q.error.message : "Failed to load"}
        onRetry={() => q.refetch()}
      />
    );
  }

  if (q.isPending || !q.data) {
    return (
      <Card className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 w-full" />
      </Card>
    );
  }

  const d = q.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">Portfolio control</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "all" ? "bg-aistroyka-surface-raised font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "critical" ? "bg-aistroyka-error/15 font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("critical")}
          >
            Critical ({d.distribution.critical})
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "attention" ? "bg-aistroyka-warning/15 font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("attention")}
          >
            Attention ({d.distribution.attention})
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "healthy" ? "bg-aistroyka-success/15 font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("healthy")}
          >
            Healthy ({d.distribution.healthy})
          </button>
        </div>
      </div>

      {d.totalProjects > d.limitedTo && (
        <p className="text-xs text-aistroyka-text-tertiary">
          Showing first {d.limitedTo} of {d.totalProjects} projects (operational cap).
        </p>
      )}

      <p className="text-sm text-aistroyka-text-secondary">
        Signals come from schedule, documents, costs, handover readiness, punch list, aftercare, and client requests — not a separate analytics warehouse.
      </p>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Project</TableHeaderCell>
            <TableHeaderCell>Portfolio state</TableHeaderCell>
            <TableHeaderCell>Focus</TableHeaderCell>
            <TableHeaderCell>Signals</TableHeaderCell>
            <TableHeaderCell>Drill down</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={p.projectHref} className="font-medium text-aistroyka-accent hover:underline">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={portfolioStateBadgeClass(p.portfolioState)}>
                  {formatPortfolioStateLabel(p.portfolioState)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm capitalize text-aistroyka-text-secondary">{categoryLabel(p.topBlockerCategory)}</span>
                <p className="text-xs text-aistroyka-text-tertiary mt-0.5 max-w-xs">{p.primaryReason}</p>
              </TableCell>
              <TableCell>
                <SignalSummary signals={p.signals} />
              </TableCell>
              <TableCell>
                <Link
                  href={drilldownHrefForCategory(p.id, p.topBlockerCategory)}
                  className="text-sm text-aistroyka-accent hover:underline"
                >
                  Open focus area →
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <p className="text-sm text-aistroyka-text-secondary">No projects in this filter.</p>
      )}
    </div>
  );
}
