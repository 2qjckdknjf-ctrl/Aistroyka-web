import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardReportsClient } from "../daily-reports/DashboardReportsClient";

export default async function ReportsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("reports")}
        subtitle="Daily reports list. Filter by project, worker, or date."
      />
      <DashboardReportsClient basePath="/dashboard/reports" />
    </>
  );
}
