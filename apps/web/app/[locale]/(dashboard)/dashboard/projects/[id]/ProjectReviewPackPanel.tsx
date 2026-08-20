"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge, Skeleton, ErrorState } from "@/components/ui";
import type { ProjectReviewPack } from "@/lib/domain/review-packs/review-packs.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchReviewPack(projectId: string): Promise<ProjectReviewPack> {
  const res = await fetch(`/api/v1/projects/${projectId}/review-pack`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load review pack");
  }
  const j = await res.json();
  return j.data;
}

function signalBadge(s: string, tDetail: ReturnType<typeof useTranslations>) {
  switch (s) {
    case "critical":
      return <Badge className="bg-aistroyka-error/20 text-aistroyka-error">{tDetail("critical")}</Badge>;
    case "attention":
      return <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">{tDetail("attention")}</Badge>;
    default:
      return <Badge className="bg-aistroyka-success/20 text-aistroyka-success">{tDetail("healthy")}</Badge>;
  }
}

export function ProjectReviewPackPanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const q = useQuery({
    queryKey: ["project-review-pack", projectId],
    queryFn: () => fetchReviewPack(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  if (q.isPending) {
    return (
      <DashboardGlassCard className="mb-6 p-4 border-l-4 border-l-aistroyka-info">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-24 w-full" />
      </DashboardGlassCard>
    );
  }

  if (q.isError) {
    return (
      <DashboardGlassCard className="mb-6 p-4 border-l-4 border-l-aistroyka-info">
        <ErrorState
          message={q.error instanceof Error ? q.error.message : tDetail("failedLoadReviewPack")}
          onRetry={() => q.refetch()}
        />
      </DashboardGlassCard>
    );
  }

  const pack = q.data!;

  return (
    <DashboardGlassCard className="mb-6 p-4 border-l-4 border-l-aistroyka-info" aria-label={tDetail("executiveReviewPack")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{tDetail("executiveReviewPack")}</h2>
          <p className="mt-1 text-xs text-aistroyka-text-tertiary">
            {tDetail("curatedSnapshot")} - {pack.header.meta.summarizes} {tDetail("generated")} {pack.generatedAt.slice(0, 16)} UTC.
          </p>
        </div>
        {signalBadge(pack.header.executiveSignal, tDetail)}
      </div>
      <p className="mt-3 text-sm text-aistroyka-text-primary font-medium">{pack.header.executiveSummary}</p>
      <p className="mt-1 text-xs text-aistroyka-text-tertiary">
        {tDetail("status")}: {pack.header.projectStatusLabel} · {tDetail("health")}: {pack.header.healthLabel}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-aistroyka-border-subtle p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">{tDetail("commercialBilling")}</p>
          <p className="mt-1 text-aistroyka-text-secondary">{pack.commercial.narrative}</p>
          <Link href={pack.commercial.href} className="mt-2 inline-block text-aistroyka-accent text-xs font-medium hover:underline">
            {tDetail("commercialTabArrow")}
          </Link>
        </div>
        <div className="rounded border border-aistroyka-border-subtle p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">{tDetail("budget")}</p>
          <p className="mt-1 text-aistroyka-text-secondary">{pack.budget.narrative}</p>
          <Link href={`/dashboard/projects/${projectId}?tab=costs`} className="mt-2 inline-block text-aistroyka-accent text-xs font-medium hover:underline">
            {tDetail("openCostsArrow")}
          </Link>
        </div>
        <div className="rounded border border-aistroyka-border-subtle p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">{tDetail("handover")}</p>
          <p className="mt-1 text-aistroyka-text-secondary">
            {pack.handover.ready
              ? tDetail("readyForHandover")
              : `${pack.handover.blockerCount} ${tDetail("blockersBeforeHandover")}`}
          </p>
          <Link href={`/dashboard/projects/${projectId}`} className="mt-2 inline-block text-aistroyka-accent text-xs font-medium hover:underline">
            {tDetail("projectOverviewArrow")}
          </Link>
        </div>
        <div className="rounded border border-aistroyka-border-subtle p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">{tDetail("aftercare")}</p>
          <p className="mt-1 text-aistroyka-text-secondary">{pack.aftercare.narrative}</p>
          <Link href={pack.aftercare.href} className="mt-2 inline-block text-aistroyka-accent text-xs font-medium hover:underline">
            {tDetail("aftercareTabArrow")}
          </Link>
        </div>
        <div className="rounded border border-aistroyka-border-subtle p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">{tDetail("actionFocus")}</p>
          <ul className="mt-1 list-disc pl-4 text-aistroyka-text-secondary space-y-1">
            {pack.actionFocus.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {pack.recentChanges.length > 0 ? (
        <div className="mt-4">
          <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary mb-2">
            {tDetail("recentStakeholderClientActivity")}
          </p>
          <ul className="space-y-1.5 text-sm">
            {pack.recentChanges.map((r) => (
              <li key={r.title + r.occurredAt}>
                <Link href={r.href} className="text-aistroyka-accent hover:underline">
                  {r.title}
                </Link>
                <span className="text-aistroyka-text-tertiary text-xs ml-2">{r.occurredAt.slice(0, 16)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardGlassCard>
  );
}
