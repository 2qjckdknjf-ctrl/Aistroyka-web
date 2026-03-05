import { getTranslations } from "next-intl/server";
import { Card, SectionHeader, EmptyState } from "@/components/ui";

export default async function DevicesPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("devices")} subtitle="Devices and sync health." />
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📱</span>}
          title="Devices & Sync"
          subtitle="Devices list and sync health will be built in Stage 5."
        />
      </Card>
    </>
  );
}
