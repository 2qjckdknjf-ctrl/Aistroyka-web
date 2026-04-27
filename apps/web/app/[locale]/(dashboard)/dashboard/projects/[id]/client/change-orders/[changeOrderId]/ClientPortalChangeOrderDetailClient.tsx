"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, EmptyState } from "@/components/ui";
import { changeOrderStatusBadgeClass, formatStatusLabel } from "../../../statusBadgeStyles";

type Event = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
};

type PublicDetail = {
  id: string;
  kind: string;
  status: string;
  title: string;
  description: string | null;
  schedule_impact_level: string;
  budget_impact_level: string;
  schedule_impact_summary: string | null;
  budget_impact_summary: string | null;
  schedule_delta_days: number | null;
  budget_delta_amount: number | null;
  has_linked_discussion: boolean;
  has_linked_document: boolean;
  has_linked_request: boolean;
  has_linked_milestone: boolean;
  implemented_at: string | null;
  created_at: string;
  updated_at: string;
  events: Event[];
};

async function fetchDetail(projectId: string, changeOrderId: string): Promise<PublicDetail> {
  const res = await fetch(`/api/v1/projects/${projectId}/change-orders/${changeOrderId}`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function ClientPortalChangeOrderDetailClient({
  projectId,
  changeOrderId,
}: {
  projectId: string;
  changeOrderId: string;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const q = useQuery({
    queryKey: ["change-order", projectId, changeOrderId],
    queryFn: () => fetchDetail(projectId, changeOrderId),
  });

  if (q.isPending) {
    return (
      <Card>
        <Skeleton className="h-40" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title={tDetail("changeOrderUnavailable")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const d = q.data!;

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/projects/${projectId}/client/change-orders`}
        className="text-aistroyka-accent hover:underline text-sm font-medium"
      >
        {tDetail("backToChangeOrders")}
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{d.title}</h1>
          <Badge className={changeOrderStatusBadgeClass(d.status)}>{formatStatusLabel(d.status)}</Badge>
        </div>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">{d.kind.replace(/_/g, " ")}</p>
      </Card>

      {d.description ? (
        <Card className="p-4">
          <h2 className="font-semibold">{tDetail("whatChanged")}</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{d.description}</p>
        </Card>
      ) : null}

      <Card className="p-4">
        <h2 className="font-semibold">{tDetail("impact")}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-text-tertiary">{tDetail("schedule")}</dt>
            <dd>{d.schedule_impact_level.replace(/_/g, " ")}</dd>
            {d.schedule_impact_summary ? <dd className="mt-1 text-aistroyka-text-secondary">{d.schedule_impact_summary}</dd> : null}
            {d.schedule_delta_days != null ? (
              <dd className="mt-1 text-aistroyka-text-secondary">{tDetail("aboutDays")} {d.schedule_delta_days} {tDetail("days")}</dd>
            ) : null}
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{tDetail("budget")}</dt>
            <dd>{d.budget_impact_level.replace(/_/g, " ")}</dd>
            {d.budget_impact_summary ? <dd className="mt-1 text-aistroyka-text-secondary">{d.budget_impact_summary}</dd> : null}
            {d.budget_delta_amount != null ? (
              <dd className="mt-1 text-aistroyka-text-secondary">{tDetail("indicativeDelta")} {d.budget_delta_amount}</dd>
            ) : null}
          </div>
        </dl>
        {(d.has_linked_discussion || d.has_linked_document || d.has_linked_request || d.has_linked_milestone) && (
          <p className="mt-4 text-xs text-aistroyka-text-tertiary">
            {tDetail("changeLinkedToRecords")}
          </p>
        )}
      </Card>

      {d.implemented_at ? (
        <p className="text-sm text-aistroyka-text-secondary">
          {tDetail("markedImplemented")} {new Date(d.implemented_at).toLocaleString()}
        </p>
      ) : null}

      <Card className="p-4">
        <h2 className="font-semibold">{tDetail("statusHistory")}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {d.events.map((e) => (
            <li key={e.id} className="rounded border border-aistroyka-border-subtle p-2">
              <span className="text-xs text-aistroyka-text-tertiary">
                {e.from_status ?? "—"} → {e.to_status} · {new Date(e.created_at).toLocaleString()}
              </span>
              {e.note ? <p className="mt-1">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
