import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardAIClient } from "./DashboardAIClient";

export default async function AIPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("ai")} subtitle="AI analysis jobs: list and detail by request ID." />
      <DashboardAIClient />
    </>
  );
}
