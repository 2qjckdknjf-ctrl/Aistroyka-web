import { getTranslations } from "next-intl/server";
import { Card, SectionHeader, EmptyState } from "@/components/ui";

export default async function UploadsPage() {
  const t = await getTranslations("nav");
  return (
    <>
      <SectionHeader title={t("uploads")} subtitle="Upload sessions status and media." />
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📤</span>}
          title="Upload sessions"
          subtitle="Upload sessions monitoring will be built in Stage 4."
        />
      </Card>
    </>
  );
}
