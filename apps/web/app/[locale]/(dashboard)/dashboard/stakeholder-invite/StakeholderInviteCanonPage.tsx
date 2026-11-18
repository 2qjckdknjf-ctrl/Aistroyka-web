"use client";

import { useTranslations } from "next-intl";
import { StakeholderInviteClient } from "./StakeholderInviteClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function StakeholderInviteCanonPage() {
  const tDetail = useTranslations("dashboardDetail");

  return (
    <DashboardCanonRouteShell title={tDetail("projectInvitation")} subtitle={tDetail("projectInvitationHint")}>
      <StakeholderInviteClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
