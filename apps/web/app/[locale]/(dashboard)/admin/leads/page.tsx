import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/ui";
import { AdminLeadsClient } from "./AdminLeadsClient";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <Link
        href="/admin"
        className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent"
      >
        {tPage("backToAdmin")}
      </Link>
      <SectionHeader
        title={tPage("contactLeadsTitle")}
        subtitle={tPage("contactLeadsSubtitle")}
      />
      <AdminLeadsClient />
    </>
  );
}
