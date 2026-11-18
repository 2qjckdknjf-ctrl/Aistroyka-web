"use client";

import { useTranslations } from "next-intl";
import { WorkloadInboxClient } from "./WorkloadInboxClient";
import { RecurringOperationsPanel } from "./RecurringOperationsPanel";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function WorkloadCanonPage() {
  const t = useTranslations("nav");
  const tPage = useTranslations("dashboardPageMeta");

  return (
    <DashboardCanonRouteShell title={t("workload")} subtitle={tPage("workloadSubtitle")}>
      <div className="space-y-6">
        <WorkloadInboxClient skin="canon" />
        <RecurringOperationsPanel skin="canon" />
      </div>
    </DashboardCanonRouteShell>
  );
}
