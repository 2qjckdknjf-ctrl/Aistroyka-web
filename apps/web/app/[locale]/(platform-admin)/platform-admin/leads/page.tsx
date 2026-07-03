import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { PlatformLeadsClient } from "@/components/platform-admin/PlatformLeadsClient";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLeadsPage() {
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={tPage("contactLeadsTitle")} subtitle={tPage("contactLeadsSubtitle")} />
      <PlatformLeadsClient />
    </>
  );
}
