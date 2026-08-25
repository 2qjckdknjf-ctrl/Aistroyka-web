"use client";

import { useTranslations } from "next-intl";
import { DashboardReportsClient } from "./DashboardReportsClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function DailyReportsCanonPage() {
  const t = useTranslations("nav");
  const tPage = useTranslations("dashboardPageMeta");

  return (
    <DashboardCanonRouteShell title={t("reports")} subtitle={tPage("dailyReportsSubtitle")}>
      <DashboardReportsClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
