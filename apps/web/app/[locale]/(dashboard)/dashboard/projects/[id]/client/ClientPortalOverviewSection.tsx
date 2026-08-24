"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton, Badge } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type OverviewPayload = {
  last_confirmed_report_at: string | null;
  last_update_at: string | null;
  data_freshness: "fresh" | "stale" | "unknown";
  open_issues_count: number;
  pending_owner_decisions: number;
  confirmed_progress_summary: string | null;
  ai_generated_sections: string[];
};

async function fetchOverview(projectId: string): Promise<OverviewPayload> {
  const res = await fetch(`/api/v1/portal/projects/${projectId}/overview`, { credentials: "include" });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Failed to load");
  }
  const json = (await res.json()) as { data: OverviewPayload };
  return json.data;
}

export function ClientPortalOverviewSection({ projectId }: { projectId: string }) {
  const t = useTranslations("dashboardDetail");
  const query = useQuery({
    queryKey: ["portal-overview", projectId],
    queryFn: () => fetchOverview(projectId),
    enabled: !!projectId,
  });

  if (query.isPending) {
    return (
      <DashboardGlassCard className="p-4">
        <Skeleton className="h-24" />
      </DashboardGlassCard>
    );
  }

  if (query.isError) return null;

  const d = query.data!;

  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-aistroyka-text-primary">{t("clientPortalOverviewTitle")}</h3>
        <Badge
          className={
            d.data_freshness === "fresh"
              ? "bg-aistroyka-success/20 text-aistroyka-success"
              : d.data_freshness === "stale"
                ? "bg-aistroyka-warning/20 text-aistroyka-warning"
                : "bg-aistroyka-text-secondary/20 text-aistroyka-text-secondary"
          }
        >
          {d.data_freshness === "fresh"
            ? t("clientPortalDataFresh")
            : d.data_freshness === "stale"
              ? t("clientPortalDataStale")
              : t("clientPortalDataUnknown")}
        </Badge>
      </div>
      {d.confirmed_progress_summary ? (
        <p className="mt-2 text-sm text-aistroyka-text-primary">{d.confirmed_progress_summary}</p>
      ) : (
        <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("clientPortalOverviewEmpty")}</p>
      )}
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-aistroyka-text-secondary">{t("clientPortalOpenIssues")}</dt>
          <dd className="font-medium text-aistroyka-text-primary">{d.open_issues_count}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-text-secondary">{t("clientPortalPendingDecisions")}</dt>
          <dd className="font-medium text-aistroyka-text-primary">{d.pending_owner_decisions}</dd>
        </div>
      </dl>
      {d.ai_generated_sections.length > 0 ? (
        <p className="mt-2 text-xs text-aistroyka-text-secondary">{t("clientPortalAiBadgeHint")}</p>
      ) : null}
    </DashboardGlassCard>
  );
}
