import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardDevicesClient } from "./DashboardDevicesClient";

export default async function DevicesPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("devices")} subtitle="Registered devices (push tokens). Health: active or disabled." />
      <DashboardDevicesClient />
    </>
  );
}
