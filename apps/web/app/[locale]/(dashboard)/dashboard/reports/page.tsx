import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardReportsClient } from "../daily-reports/DashboardReportsClient";

export default async function ReportsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("reports")}
        subtitle={tPage("reportsSubtitle")}
      />
      <DashboardReportsClient basePath="/dashboard/reports" />
    </>
  );
}
