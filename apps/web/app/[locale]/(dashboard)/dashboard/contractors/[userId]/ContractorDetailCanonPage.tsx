"use client";

import { useTranslations } from "next-intl";
import { ContractorDetailClient } from "./ContractorDetailClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function ContractorDetailCanonPage({ userId }: { userId: string }) {
  const t = useTranslations("contractorDirectory");
  const tMeta = useTranslations("dashboardPageMeta");

  return (
    <DashboardCanonRouteShell title={t("detailTitle")} subtitle={tMeta("contractorDetailSubtitle")}>
      <ContractorDetailClient userId={userId} skin="canon" />
    </DashboardCanonRouteShell>
  );
}
