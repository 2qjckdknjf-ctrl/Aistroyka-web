import { redirect } from "next/navigation";

/** Legacy daily-report detail → canon report review (screen 05). */
export default async function DailyReportDetailRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/dashboard/reports/${id}`);
}
