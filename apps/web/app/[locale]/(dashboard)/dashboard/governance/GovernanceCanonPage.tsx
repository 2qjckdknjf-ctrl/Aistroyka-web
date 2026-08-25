"use client";

import { useTranslations } from "next-intl";
import { GovernanceCasesClient } from "./GovernanceCasesClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function GovernanceCanonPage() {
  const tNav = useTranslations("nav");
  const t = useTranslations("governancePage");

  return (
    <DashboardCanonRouteShell title={tNav("governance")} subtitle={t("listSubtitle")}>
      <GovernanceCasesClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
