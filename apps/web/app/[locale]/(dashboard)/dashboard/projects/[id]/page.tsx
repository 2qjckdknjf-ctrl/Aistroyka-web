import { notFound } from "next/navigation";
import { DashboardProjectDetailClient } from "./DashboardProjectDetailClient";

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return <DashboardProjectDetailClient projectId={id} />;
}
