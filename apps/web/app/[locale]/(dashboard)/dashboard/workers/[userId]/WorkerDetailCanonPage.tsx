"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CanonPageHeader } from "@/components/canon";
import { WorkerDetailClient } from "./WorkerDetailClient";

export function WorkerDetailCanonPage({ userId }: { userId: string }) {
  const t = useTranslations("dashboardPageMeta");
  const tNav = useTranslations("nav");

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={`${tNav("workers")} ${userId.slice(0, 8)}…`}
        subtitle={t("workerDetailSubtitle")}
        showFavorite={false}
        actions={
          <Link href="/dashboard/workers" className="canon-ghost-btn text-sm">
            {t("backToWorkers")}
          </Link>
        }
      />
      <div className="canon-glass p-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
              {t("workerIdLabel")}
            </dt>
            <dd className="font-mono text-sm break-all text-[var(--canon-text-primary)]" title={userId}>
              {userId}
            </dd>
          </div>
        </dl>
      </div>
      <WorkerDetailClient userId={userId} />
      <div className="canon-glass p-4">
        <Link
          href={`/dashboard/workers/${encodeURIComponent(userId)}/days`}
          className="text-sm font-medium text-[var(--canon-cyan)] hover:underline"
        >
          {t("viewDayTimeline")}
        </Link>
      </div>
    </div>
  );
}
