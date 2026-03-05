import { getTranslations } from "next-intl/server";
import { Card, SectionHeader, EmptyState } from "@/components/ui";

export default async function WorkersPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("workers")} subtitle="Time tracking and daily reports by worker." />
      <Card>
        <EmptyState
          icon={<span className="text-2xl">👷</span>}
          title="Workers"
          subtitle="Worker list and day timeline will be built in Stage 3."
        />
      </Card>
    </>
  );
}
