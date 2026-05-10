import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { UploadsDashboardClient } from "../UploadsDashboardClient";

export default async function UploadsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={t("uploads")} subtitle={tPage("uploadsSubtitle")} />
      <UploadsDashboardClient />
    </>
  );
}
