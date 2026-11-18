"use client";

import { useTranslations } from "next-intl";
import { NotificationsClient } from "./NotificationsClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function NotificationsCanonPage() {
  const t = useTranslations("notificationsPage");

  return (
    <DashboardCanonRouteShell title={t("title")} subtitle={t("subtitle")}>
      <NotificationsClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
