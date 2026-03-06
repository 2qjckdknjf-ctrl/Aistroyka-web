import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardUploadsClient } from "./DashboardUploadsClient";

export default async function UploadsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("uploads")} subtitle="Upload sessions: status, owner, age. Filter by status or stuck &gt;4h." />
      <DashboardUploadsClient />
    </>
  );
}
