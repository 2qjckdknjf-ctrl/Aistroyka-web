import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { AdminPushOutboxClient } from "./AdminPushOutboxClient";

export default async function AdminPushPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  return (
    <>
      <SectionHeader
        title={t("adminPush")}
        subtitle={tPage("adminPushSubtitle")}
      />
      <AdminPushOutboxClient />
    </>
  );
}
