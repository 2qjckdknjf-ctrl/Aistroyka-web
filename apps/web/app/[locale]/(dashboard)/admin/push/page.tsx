import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui";
import { AdminPushOutboxClient } from "./AdminPushOutboxClient";

export default async function AdminPushPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader
        title={t("adminPush")}
        subtitle="Push notification outbox: queued, sent, and failed entries (admin only)."
      />
      <AdminPushOutboxClient />
    </>
  );
}
