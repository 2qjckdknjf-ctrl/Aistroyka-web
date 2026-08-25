"use client";

import { useTranslations } from "next-intl";
import { DashboardAlertsClient } from "./DashboardAlertsClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function AlertsCanonPage() {
  const t = useTranslations("dashboard");

  return (
    <DashboardCanonRouteShell title={t("alerts")}>
      <DashboardAlertsClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
