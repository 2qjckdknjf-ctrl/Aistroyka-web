"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, EmptyState } from "@/components/ui";
import { changeOrderStatusBadgeClass, formatStatusLabel } from "../../statusBadgeStyles";

type Row = {
  id: string;
  kind: string;
  status: string;
  title: string;
  updated_at: string;
};

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/change-orders`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

export function ClientPortalChangeOrdersListClient({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const q = useQuery({
    queryKey: ["change-orders", projectId],
    queryFn: () => fetchList(projectId),
  });

  if (q.isPending) {
    return (
      <Card>
        <Skeleton className="h-32" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title={tDetail("couldNotLoadChangeOrders")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/projects/${projectId}/client`} className="text-aistroyka-accent hover:underline text-sm font-medium">
        {tDetail("backToClientPortal")}
      </Link>
      <Card className="p-4">
        <h1 className="text-aistroyka-title3 font-semibold">{tDetail("changeOrders")}</h1>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("changeOrdersClientHint")}
        </p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-aistroyka-text-secondary">{tDetail("noChangeOrdersSharedYet")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/projects/${projectId}/client/change-orders/${r.id}`}
                  className="block rounded border border-aistroyka-border-subtle p-3 hover:bg-aistroyka-surface-raised"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-aistroyka-text-primary">{r.title}</span>
                    <Badge className={changeOrderStatusBadgeClass(r.status)}>{formatStatusLabel(r.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-aistroyka-text-tertiary">
                    {tDetail("updated")} {new Date(r.updated_at).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
