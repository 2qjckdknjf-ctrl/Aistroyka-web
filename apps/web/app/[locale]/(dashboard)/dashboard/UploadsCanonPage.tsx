"use client";

import { useTranslations } from "next-intl";
import { UploadsDashboardClient } from "./UploadsDashboardClient";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export function UploadsCanonPage() {
  const t = useTranslations("nav");
  const tPage = useTranslations("dashboardPageMeta");

  return (
    <DashboardCanonRouteShell title={t("uploads")} subtitle={tPage("uploadsSubtitle")}>
      <UploadsDashboardClient skin="canon" />
    </DashboardCanonRouteShell>
  );
}
