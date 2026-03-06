import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { AdminJobsClient } from "./AdminJobsClient";

export default async function AdminJobsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("adminJobs")}
        subtitle="Failed and dead jobs (admin only). Filter by status."
      />
      <AdminJobsClient />
    </>
  );
}
