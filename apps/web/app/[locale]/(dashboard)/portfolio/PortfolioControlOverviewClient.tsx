"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, ErrorState, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui";
import type {
  PortfolioControlResult,
  PortfolioControlSignalCounts,
} from "@/lib/domain/portfolio/portfolio-control.types";
import { drilldownHrefForCategory } from "@/lib/domain/portfolio/portfolio-control.signals";
import { formatPortfolioStateLabel, portfolioStateBadgeClass } from "./portfolioStateStyles";

function SignalSummary({
  signals,
  tDetail,
}: {
  signals: PortfolioControlSignalCounts;
  tDetail: ReturnType<typeof useTranslations>;
}) {
  const parts: string[] = [];
  if (signals.overdueMilestonesCount > 0) parts.push(`${tDetail("deltaMilestones")} ${signals.overdueMilestonesCount}`);
  if (signals.pendingApprovalsCount > 0) parts.push(`${tDetail("approvals")} ${signals.pendingApprovalsCount}`);
  if (signals.pendingClientRequestsCount > 0) parts.push(`${tDetail("clientReq")} ${signals.pendingClientRequestsCount}`);
  if (signals.openChangeOrdersCount > 0) parts.push(`CO ${signals.openChangeOrdersCount}`);
  if (signals.openDiscussionsCount > 0) parts.push(`${tDetail("disc")} ${signals.openDiscussionsCount}`);
  if (signals.pendingReportApprovalsCount > 0) parts.push(`${tDetail("reports")} ${signals.pendingReportApprovalsCount}`);
  if (signals.openIssuesCount > 0) parts.push(`${tDetail("issues")} ${signals.openIssuesCount}`);
  if (signals.blockingDefectsCount > 0) parts.push(`${tDetail("punch")} ${signals.blockingDefectsCount}`);
  if (signals.activeAftercareCount > 0) parts.push(`aftercare ${signals.activeAftercareCount}`);
  if (signals.handoverBlockerCount > 0) parts.push(`${tDetail("handover")} ${signals.handoverBlockerCount}`);
  if (signals.budgetOverBudget) parts.push(tDetail("overBudget"));
  else if (signals.budgetNearingLimit) parts.push(tDetail("budgetPressure"));
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
  const tDetail = useTranslations("dashboardDetail");
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
        message={q.error instanceof Error ? q.error.message : tDetail("failedLoad")}
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
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">{tDetail("portfolioControl")}</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "all" ? "bg-aistroyka-surface-raised font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("all")}
          >
            {tDetail("all")}
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "critical" ? "bg-aistroyka-error/15 font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("critical")}
          >
            {tDetail("critical")} ({d.distribution.critical})
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "attention" ? "bg-aistroyka-warning/15 font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("attention")}
          >
            {tDetail("attention")} ({d.distribution.attention})
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${filter === "healthy" ? "bg-aistroyka-success/15 font-medium" : "text-aistroyka-text-secondary"}`}
            onClick={() => setFilter("healthy")}
          >
            {tDetail("healthy")} ({d.distribution.healthy})
          </button>
        </div>
      </div>

      {d.totalProjects > d.limitedTo && (
        <p className="text-xs text-aistroyka-text-tertiary">
          {tDetail("showingFirst")} {d.limitedTo} {tDetail("of")} {d.totalProjects} {tDetail("projectsOperationalCap")}
        </p>
      )}

      <p className="text-sm text-aistroyka-text-secondary">
        {tDetail("portfolioControlHint")}
      </p>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("project")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("portfolioState")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("focus")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("signals")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("drillDown")}</TableHeaderCell>
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
                <SignalSummary signals={p.signals} tDetail={tDetail} />
              </TableCell>
              <TableCell>
                <Link
                  href={drilldownHrefForCategory(p.id, p.topBlockerCategory)}
                  className="text-sm text-aistroyka-accent hover:underline"
                >
                  {tDetail("openFocusArea")}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <p className="text-sm text-aistroyka-text-secondary">{tDetail("noProjectsInFilter")}</p>
      )}
    </div>
  );
}
