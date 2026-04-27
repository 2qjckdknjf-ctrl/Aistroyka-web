import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { GovernanceCasesClient } from "./GovernanceCasesClient";

export default async function GovernancePage() {
  const tNav = await getTranslations("nav");
  const t = await getTranslations("governancePage");
  return (
    <>
      <SectionHeader
        title={tNav("governance")}
        subtitle={t("listSubtitle")}
      />
      <GovernanceCasesClient />
    </>
  );
}
