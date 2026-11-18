"use client";

import { useTranslations } from "next-intl";
import { DashboardApprovalsClient } from "@/app/[locale]/(dashboard)/dashboard/approvals/DashboardApprovalsClient";
import { DashboardCanonRouteShell } from "./DashboardCanonRouteShell";

export function DashboardApprovalsCanonPage() {
  const tNav = useTranslations("nav");
  const t = useTranslations("dashboard");

  return (
    <DashboardCanonRouteShell title={tNav("approvals")} subtitle={t("approvalsSubtitle")}>
      <DashboardApprovalsClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
