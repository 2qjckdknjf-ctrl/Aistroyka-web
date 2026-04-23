import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardDevicesClient } from "./DashboardDevicesClient";

export default async function DevicesPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={t("devices")} subtitle={tPage("devicesSubtitle")} />
      <DashboardDevicesClient />
    </>
  );
}
