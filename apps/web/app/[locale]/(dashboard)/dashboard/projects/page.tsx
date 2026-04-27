import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardProjectsListClient } from "./DashboardProjectsListClient";

export default async function DashboardProjectsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("projects")}
        subtitle={tPage("projectsSubtitle")}
      />
      <DashboardProjectsListClient />
    </>
  );
}
