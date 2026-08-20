"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionHeader, Skeleton, EmptyState, Badge } from "@/components/ui";
import { discussionStatusBadgeClass } from "../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Row = {
  id: string;
  kind: string;
  status: string;
  title: string;
  updated_at: string;
};

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  return j.data ?? [];
}

export function ClientPortalDiscussionsListClient({ projectId }: { projectId: string }) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const q = useQuery({
    queryKey: ["stakeholder-discussions", projectId],
    queryFn: () => fetchList(projectId),
  });

  if (q.isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton className="h-40" />
      </DashboardGlassCard>
    );
  }

  if (q.isError) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">💬</span>}
          title={tDetail("unableToLoadDiscussions")}
          subtitle={q.error instanceof Error ? q.error.message : tDetail("tryAgainLater")}
        />
      </DashboardGlassCard>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/projects/${projectId}/client`}
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          {tDetail("backToClientPortal")}
        </Link>
      </div>
      <SectionHeader title={tPage("discussionsTitle")} subtitle={tPage("discussionsSubtitle")} />

      <DashboardGlassCard className="p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-aistroyka-text-secondary">{tPage("noOpenDiscussions")}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded border border-aistroyka-border-subtle p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/projects/${projectId}/client/discussions/${r.id}`}
                    className="font-medium text-aistroyka-accent hover:underline"
                  >
                    {r.title}
                  </Link>
                  <Badge className={discussionStatusBadgeClass(r.status)}>{formatPortalStatus(r.status, "discussion", tPortal)}</Badge>
                </div>
                <p className="mt-1 text-xs text-aistroyka-text-tertiary capitalize">{r.kind.replace(/_/g, " ")}</p>
              </li>
            ))}
          </ul>
        )}
      </DashboardGlassCard>
    </div>
  );
}
