import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, SectionHeader } from "@/components/ui";
import { WorkerDetailClient } from "./WorkerDetailClient";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  if (!userId) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/workers"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          ← Workers
        </Link>
      </div>
      <SectionHeader
        title={`Worker ${userId.slice(0, 8)}…`}
        subtitle="Worker detail and day timeline."
      />
      <Card className="mb-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Worker ID</dt>
            <dd className="font-mono text-aistroyka-caption break-all" title={userId}>{userId}</dd>
          </div>
        </dl>
      </Card>
      <WorkerDetailClient userId={userId} />
      <Card className="mt-4">
        <Link
          href={`/dashboard/workers/${encodeURIComponent(userId)}/days`}
          className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          View day timeline →
        </Link>
      </Card>
    </>
  );
}
