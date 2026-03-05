import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardReportsClient } from "./DashboardReportsClient";

export default async function DailyReportsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("reports")}
        subtitle="Daily reports list. Filter by project or date in a later iteration."
      />
      <DashboardReportsClient />
    </>
  );
}
