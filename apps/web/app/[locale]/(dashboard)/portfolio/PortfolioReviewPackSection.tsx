"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge, Skeleton, ErrorState } from "@/components/ui";
import type { PortfolioReviewPack } from "@/lib/domain/review-packs/review-packs.types";
import { formatPortfolioStateLabel, portfolioStateBadgeClass } from "./portfolioStateStyles";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchPack(): Promise<PortfolioReviewPack> {
  const res = await fetch("/api/v1/portfolio/review-pack", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function PortfolioReviewPackSection() {
  const tDetail = useTranslations("dashboardDetail");
  const q = useQuery({ queryKey: ["portfolio-review-pack"], queryFn: fetchPack, staleTime: 60 * 1000 });

  if (q.isPending) {
    return (
      <DashboardGlassCard className="mb-aistroyka-8 border-l-4 border-l-aistroyka-info p-4">
        <Skeleton className="h-8 w-64 mb-3" />
        <Skeleton className="h-32 w-full" />
      </DashboardGlassCard>
    );
  }

  if (q.isError) {
    return (
      <DashboardGlassCard className="mb-aistroyka-8 border-l-4 border-l-aistroyka-info p-4">
        <ErrorState
          message={q.error instanceof Error ? q.error.message : tDetail("failedLoad")}
          onRetry={() => q.refetch()}
        />
      </DashboardGlassCard>
    );
  }

  const pack = q.data!;

  return (
    <DashboardGlassCard className="mb-aistroyka-8 border-l-4 border-l-aistroyka-info p-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{tDetail("portfolioReviewPack")}</h2>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{pack.header.summaryLine}</p>
        </div>
        <Badge className={portfolioStateBadgeClass(pack.header.executiveSignal)}>
          {formatPortfolioStateLabel(pack.header.executiveSignal)}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-aistroyka-text-primary">{pack.header.narrative}</p>
      {pack.governanceEscalations && pack.governanceEscalations.openCount > 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary border-t border-aistroyka-border-subtle pt-3">
          <strong>{pack.governanceEscalations.openCount}</strong> {tDetail("openCrossProjectGovernanceCases")}
          {pack.governanceEscalations.criticalOpenCount > 0
            ? ` (${pack.governanceEscalations.criticalOpenCount} critical)`
            : ""}
          .{" "}
          <Link href="/dashboard/governance" className="text-aistroyka-accent font-medium hover:underline">
            {tDetail("openGovernance")}
          </Link>
        </p>
      ) : null}
      {pack.commercialSignals && pack.commercialSignals.overdueCount > 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary border-t border-aistroyka-border-subtle pt-3">
          <strong>{pack.commercialSignals.overdueCount}</strong> {tDetail("commercialBillingLinesOverdue")}
          {pack.commercialSignals.openUnpaidCount > 0
            ? ` (${pack.commercialSignals.openUnpaidCount} ${tDetail("openUnpaidLines")})`
            : ""}
          . {tDetail("reviewProjectCommercialTabs")}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-aistroyka-text-tertiary">{pack.header.meta.expectedAction}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div>
          <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary mb-2">{tDetail("criticalProjects")}</p>
          {pack.criticalProjects.length === 0 ? (
            <p className="text-sm text-aistroyka-text-tertiary">{tDetail("noneInCurrentSample")}</p>
          ) : (
            <ul className="space-y-2">
              {pack.criticalProjects.map((p) => (
                <li key={p.id} className="rounded border border-aistroyka-border-subtle p-2 text-sm">
                  <Link href={p.projectHref} className="font-medium text-aistroyka-accent hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-aistroyka-text-secondary mt-0.5">{p.primaryReason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary mb-2">{tDetail("attentionProjects")}</p>
          {pack.attentionProjects.length === 0 ? (
            <p className="text-sm text-aistroyka-text-tertiary">{tDetail("noneInCurrentSample")}</p>
          ) : (
            <ul className="space-y-2">
              {pack.attentionProjects.map((p) => (
                <li key={p.id} className="rounded border border-aistroyka-border-subtle p-2 text-sm">
                  <Link href={p.projectHref} className="font-medium text-aistroyka-accent hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-aistroyka-text-secondary mt-0.5">{p.primaryReason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded border border-aistroyka-border-subtle p-3">
        <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary mb-2">{tDetail("actionFocus")}</p>
        <ul className="list-disc pl-4 text-sm text-aistroyka-text-secondary space-y-1">
          {pack.actionFocus.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">
          {tDetail("healthyProjectsInSample")} {pack.healthyCount} · {tDetail("snapshotLimitedTo")} {pack.distribution.limitedTo} {tDetail("of")}{" "}
          {pack.distribution.totalProjects} {tDetail("total")}
        </p>
      </div>
    </DashboardGlassCard>
  );
}
