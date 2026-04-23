import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardWorkersClient } from "./DashboardWorkersClient";

export default async function WorkersPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("workers")}
        subtitle={tPage("workersSubtitle")}
      />
      <DashboardWorkersClient />
    </>
  );
}
