"use client";

import { useTranslations } from "next-intl";
import { AuthMethodsSettingsCard } from "@/components/auth/AuthMethodsSettingsCard";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function SettingsAuthCanonPage() {
  const t = useTranslations("canon");
  const tAuth = useTranslations("auth");

  return (
    <DashboardCanonRouteShell title={t("navSettings")} subtitle={tAuth("linkedMethodsHint")}>
      <AuthMethodsSettingsCard skin="canon" />
    </DashboardCanonRouteShell>
  );
}
