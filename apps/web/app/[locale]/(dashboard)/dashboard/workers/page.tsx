import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardWorkersClient } from "./DashboardWorkersClient";

export default async function WorkersPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("workers")}
        subtitle="Time tracking and last report by worker. Open Days for day timeline."
      />
      <DashboardWorkersClient />
    </>
  );
}
