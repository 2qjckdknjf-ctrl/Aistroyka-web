import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardTasksClient } from "./DashboardTasksClient";

export default async function DashboardTasksPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("tasks")}
        subtitle="Create and assign tasks. Filter by project, status, or date."
      />
      <DashboardTasksClient />
    </>
  );
}
