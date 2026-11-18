import { getTranslations } from "next-intl/server";
import { CanonPageHeader } from "@/components/canon/CanonPageHeader";
import { DashboardReportsClient } from "../daily-reports/DashboardReportsClient";

export default async function ReportsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");

  return (
    <div className="space-y-4">
      <CanonPageHeader
        title={t("reports")}
        subtitle={tPage("reportsSubtitle")}
        showFavorite={false}
      />
      <DashboardReportsClient basePath="/dashboard/reports" skin="canon" />
    </div>
  );
}
