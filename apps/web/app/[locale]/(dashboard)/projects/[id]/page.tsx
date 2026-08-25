import { redirect } from "next/navigation";

/** Legacy Project Intelligence → Command Center intelligence tab (canon IA). */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/dashboard/projects/${id}`);
}
