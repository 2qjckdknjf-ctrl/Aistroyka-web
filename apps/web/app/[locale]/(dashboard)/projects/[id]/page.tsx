import { redirect } from "next/navigation";

/** Legacy Project Intelligence → Project Command Center (canon IA). */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/dashboard/projects/${id}`);
}
