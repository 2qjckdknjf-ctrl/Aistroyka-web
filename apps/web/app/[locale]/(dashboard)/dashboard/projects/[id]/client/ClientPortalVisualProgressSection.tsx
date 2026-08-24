"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton, Badge } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type VisualProgressPayload = {
  items: Array<{
    id: string;
    zone_label: string | null;
    before_after_kind: "before" | "after" | "unpaired" | null;
    capture_timestamp: string | null;
    manager_verified: boolean;
    image_url: string | null;
    ai_generated: boolean;
    source_label: string;
  }>;
  stale: boolean;
  last_updated_at: string | null;
};

async function fetchVisualProgress(projectId: string): Promise<VisualProgressPayload> {
  const res = await fetch(`/api/v1/portal/projects/${projectId}/visual-progress`, {
    credentials: "include",
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Failed to load");
  }
  const json = (await res.json()) as { data: VisualProgressPayload };
  return json.data;
}

export function ClientPortalVisualProgressSection({ projectId }: { projectId: string }) {
  const t = useTranslations("dashboardDetail");
  const query = useQuery({
    queryKey: ["portal-visual-progress", projectId],
    queryFn: () => fetchVisualProgress(projectId),
    enabled: !!projectId,
  });

  if (query.isPending) {
    return (
      <DashboardGlassCard className="p-4">
        <Skeleton className="h-32" />
      </DashboardGlassCard>
    );
  }

  if (query.isError) return null;

  const d = query.data!;

  return (
    <DashboardGlassCard className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-aistroyka-text-primary">{t("clientPortalVisualProgressTitle")}</h3>
        {d.stale ? (
          <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">{t("clientPortalDataStale")}</Badge>
        ) : null}
      </div>
      {d.items.length === 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">{t("clientPortalVisualProgressEmpty")}</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-lg border border-aistroyka-border/40">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.zone_label ?? item.source_label}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-aistroyka-surface-secondary text-sm text-aistroyka-text-secondary">
                  {t("clientPortalVisualProgressNoImage")}
                </div>
              )}
              <div className="space-y-1 p-2 text-xs">
                <div className="flex flex-wrap gap-1">
                  {item.before_after_kind ? (
                    <Badge className="bg-aistroyka-accent/15 text-aistroyka-accent">{item.before_after_kind}</Badge>
                  ) : null}
                  {item.manager_verified ? (
                    <Badge className="bg-aistroyka-success/15 text-aistroyka-success">
                      {t("clientPortalManagerVerified")}
                    </Badge>
                  ) : null}
                  {item.ai_generated ? (
                    <Badge className="bg-aistroyka-info/15 text-aistroyka-info">{t("clientPortalAiGenerated")}</Badge>
                  ) : null}
                </div>
                <p className="text-aistroyka-text-secondary">{item.source_label}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardGlassCard>
  );
}
