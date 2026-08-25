import { notFound } from "next/navigation";
import { WorkerDetailCanonPage } from "./WorkerDetailCanonPage";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  if (!userId) notFound();
  return <WorkerDetailCanonPage userId={userId} />;
}
