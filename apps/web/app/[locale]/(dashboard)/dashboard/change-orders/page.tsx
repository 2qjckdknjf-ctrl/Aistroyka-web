import { redirect } from "next/navigation";

/** Change orders live under each project (`?tab=change-orders`). */
export default async function DashboardChangeOrdersRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/projects`);
}
