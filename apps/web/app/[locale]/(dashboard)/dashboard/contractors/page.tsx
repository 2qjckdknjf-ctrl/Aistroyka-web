import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { ContractorsDirectoryClient } from "./ContractorsDirectoryClient";

export default async function ContractorsDirectoryPage() {
  const t = await getTranslations("contractorDirectory");
  const tMeta = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={t("pageTitle")} subtitle={tMeta("contractorsSubtitle")} />
      <ContractorsDirectoryClient />
    </>
  );
}
