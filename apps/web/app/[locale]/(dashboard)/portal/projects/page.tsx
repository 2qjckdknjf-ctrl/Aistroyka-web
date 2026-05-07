import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { PortalProjectsListClient } from "./PortalProjectsListClient";

export default async function PortalProjectsPage() {
  const t = await getTranslations("portalPage");
  return (
    <>
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="mt-aistroyka-6">
        <PortalProjectsListClient />
      </div>
    </>
  );
}
