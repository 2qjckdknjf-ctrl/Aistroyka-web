"use client";

import { useTranslations } from "next-intl";
import { DashboardWorkersClient } from "@/app/[locale]/(dashboard)/dashboard/workers/DashboardWorkersClient";
import { CanonPageHeader } from "./CanonPageHeader";

export function DashboardWorkersCanonPage() {
  const tDetail = useTranslations("dashboardDetail");
  const tMeta = useTranslations("dashboardPageMeta");

  return (
    <div className="space-y-6">
      <CanonPageHeader title={tDetail("workers")} subtitle={tMeta("workersSubtitle")} showFavorite={false} />
      <DashboardWorkersClient skin="canon" />
    </div>
  );
}
