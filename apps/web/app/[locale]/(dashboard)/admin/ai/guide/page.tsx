import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui";
import { AIGuideAnalyticsClient } from "./AIGuideAnalyticsClient";

export default async function AdminAIGuideAnalyticsPage() {
  const t = await getTranslations("adminAiGuide");
  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("pageSubtitle")}</p>
      </Card>
      <AIGuideAnalyticsClient />
    </>
  );
}
