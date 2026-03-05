import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardProjectsListClient } from "./DashboardProjectsListClient";

export default async function DashboardProjectsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("projects")}
        subtitle="List and open projects. Use search to filter by name."
      />
      <DashboardProjectsListClient />
    </>
  );
}
