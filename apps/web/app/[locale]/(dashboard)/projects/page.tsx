import { redirect } from "next/navigation";

/** Legacy `/projects` → Command Center projects list (canon IA). */
export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/projects`);
}
