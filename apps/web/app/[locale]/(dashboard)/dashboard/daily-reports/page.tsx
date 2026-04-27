import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardReportsClient } from "./DashboardReportsClient";

export default async function DailyReportsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("reports")}
        subtitle={tPage("dailyReportsSubtitle")}
      />
      <DashboardReportsClient />
    </>
  );
}
