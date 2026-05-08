import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { ContractorDetailClient } from "./ContractorDetailClient";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("contractorDirectory");
  const tMeta = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader title={t("detailTitle")} subtitle={tMeta("contractorDetailSubtitle")} />
      <ContractorDetailClient userId={userId} />
    </>
  );
}
