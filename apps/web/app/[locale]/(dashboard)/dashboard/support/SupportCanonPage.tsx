"use client";

import { useTranslations } from "next-intl";
import { SupportClient } from "./SupportClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function SupportCanonPage() {
  const t = useTranslations("nav");

  return (
    <DashboardCanonRouteShell title={t("support")}>
      <SupportClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
