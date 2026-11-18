"use client";

import { useTranslations } from "next-intl";
import { DashboardDevicesClient } from "./DashboardDevicesClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function DevicesCanonPage() {
  const t = useTranslations("nav");
  const tPage = useTranslations("dashboardPageMeta");

  return (
    <DashboardCanonRouteShell title={t("devices")} subtitle={tPage("devicesSubtitle")}>
      <DashboardDevicesClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
