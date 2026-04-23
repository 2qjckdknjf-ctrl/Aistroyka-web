import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { AdminLeadDetailClient } from "./AdminLeadDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminLeadDetailPage() {
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={tPage("leadDetailTitle")} subtitle={tPage("leadDetailSubtitle")} />
      <AdminLeadDetailClient />
    </>
  );
}
