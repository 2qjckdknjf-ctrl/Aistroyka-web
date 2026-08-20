import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/ui";
import { WorkerDetailClient } from "./WorkerDetailClient";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("dashboardPageMeta");
  const tNav = await getTranslations("nav");
  if (!userId) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/workers"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          {t("backToWorkers")}
        </Link>
      </div>
      <SectionHeader
        title={`${tNav("workers")} ${userId.slice(0, 8)}…`}
        subtitle={t("workerDetailSubtitle")}
      />
      <DashboardGlassCard className="mb-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("workerIdLabel")}</dt>
            <dd className="font-mono text-aistroyka-caption break-all" title={userId}>{userId}</dd>
          </div>
        </dl>
      </DashboardGlassCard>
      <WorkerDetailClient userId={userId} />
      <DashboardGlassCard className="mt-4">
        <Link
          href={`/dashboard/workers/${encodeURIComponent(userId)}/days`}
          className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          {t("viewDayTimeline")}
        </Link>
      </DashboardGlassCard>
    </>
  );
}
