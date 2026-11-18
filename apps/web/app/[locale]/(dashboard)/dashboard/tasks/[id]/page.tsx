import { notFound } from "next/navigation";
import { TaskDetailCanonPage } from "./TaskDetailCanonPage";

export default async function DashboardTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return <TaskDetailCanonPage taskId={id} />;
}
