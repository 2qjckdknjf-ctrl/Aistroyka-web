"use client";

import { useTranslations } from "next-intl";
import { ContractorsDirectoryClient } from "@/app/[locale]/(dashboard)/dashboard/contractors/ContractorsDirectoryClient";
import { CanonPageHeader } from "./CanonPageHeader";

export function DashboardContractorsCanonPage() {
  const t = useTranslations("contractorDirectory");
  const tMeta = useTranslations("dashboardPageMeta");

  return (
    <div className="space-y-6">
      <CanonPageHeader title={t("pageTitle")} subtitle={tMeta("contractorsSubtitle")} showFavorite={false} />
      <ContractorsDirectoryClient skin="canon" />
    </div>
  );
}
