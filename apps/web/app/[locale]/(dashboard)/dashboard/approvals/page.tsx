import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { DashboardApprovalsClient } from "./DashboardApprovalsClient";

const FALLBACK_T = (k: string) => k;

export default async function ApprovalsPage() {
  let t = FALLBACK_T;
  let tNav = FALLBACK_T;
  try {
    t = (await getTranslations("dashboard")) as (key: string) => string;
    tNav = (await getTranslations("nav")) as (key: string) => string;
  } catch {
    // i18n fallback
  }

  return (
    <>
      <SectionHeader
        title={tNav("approvals")}
        subtitle={t("approvalsSubtitle")}
      />
      <DashboardApprovalsClient />
    </>
  );
}
