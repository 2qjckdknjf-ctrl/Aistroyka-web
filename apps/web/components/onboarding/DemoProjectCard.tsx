"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

/** Demo dataset shape for display when user has no projects. */
export const DEMO_PROJECT = {
  id: "demo",
  taskIds: ["t1", "t2", "t3"] as const,
  reportCount: 2,
  photos: 12,
};

export function DemoProjectCard() {
  const t = useTranslations("onboarding.demoProject");
  const d = DEMO_PROJECT;
  return (
    <DashboardGlassCard contentClassName="overflow-hidden p-0">
      <div className="border-b border-aistroyka-border-subtle surface-glass-muted px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            {t("name")}
          </h3>
          <span className="rounded-full bg-aistroyka-accent-light px-2 py-0.5 text-aistroyka-caption font-medium text-aistroyka-accent">
            {t("badge")}
          </span>
        </div>
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">
          {t("description")}
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {t("tasksHeading")}
          </h4>
          <ul className="mt-2 space-y-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
            <li>• {t("taskFoundation")}</li>
            <li>• {t("taskSafety")}</li>
            <li>• {t("taskDelivery")}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {t("reportsHeading")}
          </h4>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("reportsPhotos", { reports: d.reportCount, photos: d.photos })}
          </p>
        </div>
        <div>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {t("aiInsightsHeading")}
          </h4>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary line-clamp-2">
            {t("aiSummary")}
          </p>
        </div>
      </div>
      <div className="border-t border-aistroyka-border-subtle surface-glass-muted px-4 py-3">
        <Link
          href="/projects/new"
          className="text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
        >
          {t("cta")}
        </Link>
      </div>
    </DashboardGlassCard>
  );
}
