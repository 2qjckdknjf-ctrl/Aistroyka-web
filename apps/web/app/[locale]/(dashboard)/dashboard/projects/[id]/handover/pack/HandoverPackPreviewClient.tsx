"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Skeleton, ErrorState } from "@/components/ui";
import type { HandoverManagerPackPayload, HandoverOwnerPackPayload } from "@/lib/domain/project-handover/handover-pack.types";
import { translateApiError } from "@/lib/i18n/api-error-messages";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchPack(
  projectId: string,
  locale: string,
  tErr: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<HandoverManagerPackPayload | HandoverOwnerPackPayload> {
  const qs = new URLSearchParams({ locale });
  const res = await fetch(`/api/v1/projects/${projectId}/handover/pack?${qs.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(translateApiError(typeof j.error === "string" ? j.error : undefined, tErr));
  }
  const j = await res.json();
  return j.data;
}

export function HandoverPackPreviewClient({ projectId }: { projectId: string }) {
  const locale = useLocale();
  const t = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const tApi = useTranslations("apiErrors");
  const q = useQuery({
    queryKey: ["handover-pack", projectId, locale],
    queryFn: () => fetchPack(projectId, locale, tApi),
    enabled: !!projectId,
  });

  if (q.isPending) {
    return (
      <main className="mx-auto max-w-3xl p-6 print:p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (q.isError) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <ErrorState message={q.error instanceof Error ? q.error.message : t("handoverPackLoadFailed")} onRetry={() => q.refetch()} />
        <Link href={`/dashboard/projects/${projectId}`} className="mt-4 inline-block text-sm text-aistroyka-accent hover:underline">
          {t("handoverPackBackProject")}
        </Link>
      </main>
    );
  }

  const pack = q.data!;
  const isManager = pack.audience === "manager";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 print:max-w-none print:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link href={`/dashboard/projects/${projectId}`} className="text-sm text-aistroyka-accent hover:underline">
            {t("handoverPackBackProject")}
          </Link>
          <h1 className="mt-2 text-aistroyka-title3 font-bold text-aistroyka-text-primary">{t("handoverPackPageTitle")}</h1>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("handoverPackHint")}</p>
          <p className="mt-1 text-xs text-aistroyka-text-tertiary">
            {t("handoverPackGenerated")}: {pack.generated_at.slice(0, 16)} UTC · {pack.project.name}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
          {t("handoverPackPrint")}
        </Button>
      </div>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">
          {t("handoverPackPageTitle")} — {pack.project.name}
        </h1>
        <p className="text-sm text-aistroyka-text-secondary">{pack.generated_at.slice(0, 16)} UTC</p>
      </div>

      {isManager ? (
        <DashboardGlassCard className="p-4 print:border print:shadow-none">
          <h2 className="font-semibold text-aistroyka-text-primary">{t("handoverPackReadiness")}</h2>
          {pack.readiness.ready ? (
            <p className="mt-2 text-sm text-aistroyka-success">{t("handoverPackReady")}</p>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-aistroyka-warning">{t("handoverPackNotReady")}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-aistroyka-text-secondary">
                {pack.readiness.blockers.map((b) => (
                  <li key={b.code}>
                    {b.title}
                    {b.count > 1 ? ` (${b.count})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!pack.portal_preview_full ? (
            <p className="mt-3 text-xs text-aistroyka-text-tertiary">{t("handoverPackPortalPartial")}</p>
          ) : null}
        </DashboardGlassCard>
      ) : null}

      {!isManager && pack.handover ? (
        <DashboardGlassCard className="p-4 print:border print:shadow-none">
          <h2 className="font-semibold text-aistroyka-text-primary">{t("handoverCompletion")}</h2>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{formatPortalStatus(pack.handover.status, "handover", tPortal)}</p>
          {pack.handover.handover_notes ? (
            <p className="mt-2 text-sm text-aistroyka-text-primary whitespace-pre-wrap">{pack.handover.handover_notes}</p>
          ) : null}
        </DashboardGlassCard>
      ) : null}

      <div className="space-y-4">
        {pack.sections.map((s) => (
          <DashboardGlassCard key={s.id} className="p-4 print:break-inside-avoid print:border print:shadow-none">
            <h3 className="font-semibold text-aistroyka-text-primary">{t(`handoverPackSectionTitles.${s.id}`)}</h3>
            <p className="mt-1 text-sm text-aistroyka-text-secondary">{s.summary}</p>
            {s.lines && s.lines.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-sm text-aistroyka-text-secondary">
                {s.lines.map((line, i) => (
                  <li key={`${s.id}-${i}`}>{line}</li>
                ))}
              </ul>
            ) : null}
            {s.href ? (
              <p className="mt-2 text-xs print:hidden">
                <Link href={s.href} className="text-aistroyka-accent hover:underline">
                  {t("open")}
                </Link>
              </p>
            ) : null}
          </DashboardGlassCard>
        ))}
      </div>
    </main>
  );
}
