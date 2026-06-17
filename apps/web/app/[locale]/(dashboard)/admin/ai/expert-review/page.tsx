import { Card } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { isExpertReviewQueueUiEnabled } from "@/lib/platform/ai-flywheel/expert-review-queue/expert-review-queue.ui-gate";
import { AdminExpertReviewClient } from "./AdminExpertReviewClient";
import { getTranslations } from "next-intl/server";

export default async function AdminExpertReviewPage() {
  const t = await getTranslations("aiFlywheel.expertReview");
  const enabled = isExpertReviewQueueUiEnabled();

  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("pageDescription")}</p>
        <p className="mt-3">
          <Link href="/admin/ai" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            ← AI Observability
          </Link>
        </p>
      </Card>
      {enabled ? (
        <AdminExpertReviewClient />
      ) : (
        <Card className="max-w-2xl">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{t("disabled")}</p>
        </Card>
      )}
    </>
  );
}
