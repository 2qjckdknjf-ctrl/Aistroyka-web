"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton } from "@/components/ui";

async function fetchWorkerSummary(userId: string): Promise<{ reports_count: number; media_count: number }> {
  const res = await fetch(`/api/v1/workers/${encodeURIComponent(userId)}/summary`, { credentials: "include" });
  if (!res.ok) return { reports_count: 0, media_count: 0 };
  const json = await res.json();
  return json.data ?? { reports_count: 0, media_count: 0 };
}

export function WorkerDetailClient({ userId }: { userId: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["worker-summary", userId],
    queryFn: () => fetchWorkerSummary(userId),
    enabled: !!userId,
  });

  if (isPending) return <Card className="p-4"><Skeleton lines={2} /></Card>;
  const reports_count = data?.reports_count ?? 0;
  const media_count = data?.media_count ?? 0;

  return (
    <Card className="p-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Reports created</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{reports_count}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Media count</dt>
          <dd className="text-aistroyka-title3 font-semibold tabular-nums">{media_count}</dd>
        </div>
      </dl>
      <p className="mt-3 text-aistroyka-caption text-aistroyka-text-secondary">
        <Link href="/dashboard/daily-reports" className="text-aistroyka-accent hover:underline">View all reports</Link> to see this worker&apos;s submissions.
      </p>
    </Card>
  );
}
