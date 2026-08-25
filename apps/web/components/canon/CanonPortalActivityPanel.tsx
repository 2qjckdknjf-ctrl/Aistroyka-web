"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ActivityItem = {
  id: string;
  eventType: string;
  occurredAt: string;
  title: string;
  description: string | null;
  projectId: string;
  targetUrl: string | null;
  actionNeeded: boolean;
};

async function fetchPortalActivity(projectId: string): Promise<ActivityItem[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-activity?limit=35`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function CanonPortalActivityPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");

  const q = useQuery({
    queryKey: ["stakeholder-activity", projectId, "portal-canon"],
    queryFn: () => fetchPortalActivity(projectId),
    enabled: !!projectId,
  });

  const items = q.data ?? [];
  const mediaLike = items.filter((item) =>
    /report|photo|media|upload|image|defect|progress/i.test(item.eventType + item.title)
  );
  const displayed = mediaLike.length > 0 ? mediaLike.slice(0, 8) : items.slice(0, 6);

  return (
    <div className="canon-portal-gallery canon-glass p-4">
      <h3 className="font-semibold text-[var(--canon-text-primary)]">{t("portalPhotoGallery")}</h3>
      <p className="mt-1 text-xs text-[var(--canon-text-muted)]">{tDetail("requestsResponsesPortalAccessHint")}</p>

      {q.isPending ? (
        <p className="mt-3 text-sm text-[var(--canon-text-muted)]">{tDetail("loadingActivity")}</p>
      ) : displayed.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--canon-text-muted)]">{tDetail("noClientPortalActivityYet")}</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {displayed.map((item) => (
            <Link
              key={item.id}
              href={item.targetUrl ?? `/portal/projects/${projectId}`}
              className={`rounded-lg border p-3 transition-colors hover:border-[var(--canon-cyan-dim)] ${
                item.actionNeeded
                  ? "border-[var(--canon-gold)] bg-[rgba(255,193,7,0.08)]"
                  : "border-[var(--canon-border-glass)] bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <p className="text-sm font-medium text-[var(--canon-text-primary)]">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-xs text-[var(--canon-text-secondary)] line-clamp-2">{item.description}</p>
              ) : null}
              <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--canon-text-muted)]">
                {new Date(item.occurredAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
