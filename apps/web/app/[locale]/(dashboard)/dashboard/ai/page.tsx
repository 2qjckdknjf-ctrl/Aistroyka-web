import { getTranslations } from "next-intl/server";
import { Card, SectionHeader, EmptyState } from "@/components/ui";

export default async function AIPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("ai")} subtitle="AI analysis queue and insights." />
      <Card>
        <EmptyState
          icon={<span className="text-2xl">🤖</span>}
          title="AI Insights"
          subtitle="AI analysis history and insights will be built in Stage 6."
        />
      </Card>
    </>
  );
}
