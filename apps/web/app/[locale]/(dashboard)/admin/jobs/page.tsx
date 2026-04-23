import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { AdminJobsClient } from "./AdminJobsClient";

export default async function AdminJobsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("adminJobs")}
        subtitle={tPage("adminJobsSubtitle")}
      />
      <AdminJobsClient />
    </>
  );
}
