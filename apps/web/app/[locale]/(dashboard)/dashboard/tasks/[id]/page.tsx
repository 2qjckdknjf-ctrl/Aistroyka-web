import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/ui";
import { DashboardTaskDetailClient } from "./DashboardTaskDetailClient";

export default async function DashboardTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("nav");
  if (!id) notFound();
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader title={t("tasks")} subtitle="Task detail" />
        <Link href="/dashboard/tasks" className="text-aistroyka-accent hover:underline">
          ← Back to tasks
        </Link>
      </div>
      <DashboardTaskDetailClient taskId={id} />
    </>
  );
}
