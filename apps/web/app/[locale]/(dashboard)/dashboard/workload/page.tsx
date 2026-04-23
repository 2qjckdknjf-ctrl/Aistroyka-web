import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { WorkloadInboxClient } from "./WorkloadInboxClient";
import { RecurringOperationsPanel } from "./RecurringOperationsPanel";

export default async function WorkloadPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("workload")}
        subtitle={tPage("workloadSubtitle")}
      />
      <WorkloadInboxClient />
      <RecurringOperationsPanel />
    </>
  );
}
