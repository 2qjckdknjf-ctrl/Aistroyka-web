import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardAIClient } from "./DashboardAIClient";

export default async function AIPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={t("ai")} subtitle={tPage("aiSubtitle")} />
      <DashboardAIClient />
    </>
  );
}
