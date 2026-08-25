"use client";

import { useTranslations } from "next-intl";
import { GovernanceCaseDetailClient } from "./GovernanceCaseDetailClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function GovernanceCaseDetailCanonPage({ caseId }: { caseId: string }) {
  const t = useTranslations("governancePage");

  return (
    <DashboardCanonRouteShell title={t("detailTitle")} subtitle={t("detailSubtitle")}>
      <GovernanceCaseDetailClient caseId={caseId} skin="canon" />
    </DashboardCanonRouteShell>
  );
}
