import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardTasksClient } from "./DashboardTasksClient";

export default async function DashboardTasksPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("tasks")}
        subtitle={tPage("tasksSubtitle")}
      />
      <DashboardTasksClient />
    </>
  );
}
