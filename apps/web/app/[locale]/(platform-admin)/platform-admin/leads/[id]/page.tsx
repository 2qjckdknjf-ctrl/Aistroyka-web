import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { PlatformLeadDetailClient } from "@/components/platform-admin/PlatformLeadDetailClient";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLeadDetailPage() {
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={tPage("leadDetailTitle")} subtitle={tPage("leadDetailSubtitle")} />
      <PlatformLeadDetailClient />
    </>
  );
}
