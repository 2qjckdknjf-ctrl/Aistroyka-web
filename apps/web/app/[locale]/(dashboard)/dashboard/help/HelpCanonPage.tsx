"use client";

import { useTranslations } from "next-intl";
import { HelpCenterClient } from "@/components/help/HelpCenterClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function HelpCanonPage() {
  const t = useTranslations("canon");

  return (
    <DashboardCanonRouteShell title={t("help")}>
      <HelpCenterClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
