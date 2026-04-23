import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { GovernanceCaseDetailClient } from "./GovernanceCaseDetailClient";

export default async function GovernanceCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("governancePage");
  return (
    <>
      <SectionHeader title={t("detailTitle")} subtitle={t("detailSubtitle")} />
      <GovernanceCaseDetailClient caseId={id} />
    </>
  );
}
