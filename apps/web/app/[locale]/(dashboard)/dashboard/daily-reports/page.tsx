import { getTranslations } from "next-intl/server";
import { Card, SectionHeader, EmptyState } from "@/components/ui";

export default async function DailyReportsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("reports")} subtitle="Daily reports list and detail." />
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title="Reports"
          subtitle="Reports list and detail will be built in Stage 3."
        />
      </Card>
    </>
  );
}
