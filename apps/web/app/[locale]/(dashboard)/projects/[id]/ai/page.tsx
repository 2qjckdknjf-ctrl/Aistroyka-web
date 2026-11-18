import { redirect } from "next/navigation";

/** Legacy project AI page → Command Center AI tab (canon IA). */
export default async function ProjectAiPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/dashboard/projects/${id}?tab=ai`);
}
