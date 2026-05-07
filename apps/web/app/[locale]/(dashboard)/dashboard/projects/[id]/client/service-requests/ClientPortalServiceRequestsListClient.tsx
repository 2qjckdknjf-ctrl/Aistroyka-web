"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui";
import { serviceRequestStatusBadgeClass } from "../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";

type Row = {
  id: string;
  title: string;
  status: string;
  coverage_type: string;
  due_date: string | null;
  updated_at: string;
};

function coverageLabel(c: string, tDetail: ReturnType<typeof useTranslations>): string {
  if (c === "warranty_covered") return tDetail("warranty");
  if (c === "not_warranty") return tDetail("notWarranty");
  return tDetail("underReview");
}

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/service-requests`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

export function ClientPortalServiceRequestsListClient({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const q = useQuery({
    queryKey: ["project-service-requests", projectId],
    queryFn: () => fetchList(projectId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not submit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-service-requests", projectId] });
      setTitle("");
      setDescription("");
      setOpen(false);
    },
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
          icon={<span className="text-2xl">🛠️</span>}
          title={tDetail("couldNotLoadAftercare")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/projects/${projectId}/client`} className="text-aistroyka-accent hover:underline text-sm font-medium">
        {tDetail("backToClientView")}
      </Link>
      <Card className="p-4">
        <h1 className="text-aistroyka-title3 font-semibold">{tDetail("aftercareWarranty")}</h1>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("aftercareClientHint")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
            {open ? tDetail("cancel") : tDetail("reportAnIssue")}
          </Button>
        </div>
        {open ? (
          <div className="mt-4 space-y-2 rounded border border-aistroyka-border-subtle p-3">
            <input
              className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              placeholder={tDetail("shortTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={3}
              placeholder={tDetail("whatShouldTeamLookAt")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="button" size="sm" disabled={!title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? tDetail("submitting") : tDetail("submit")}
            </Button>
            {createMutation.isError ? (
              <p className="text-xs text-aistroyka-error">{(createMutation.error as Error).message}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("coverage")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link
                  href={`/dashboard/projects/${projectId}/client/service-requests/${r.id}`}
                  className="font-medium text-aistroyka-accent hover:underline"
                >
                  {r.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={`${serviceRequestStatusBadgeClass(r.status)} font-normal`}>{formatPortalStatus(r.status, "serviceRequest", tPortal)}</Badge>
              </TableCell>
              <TableCell>{coverageLabel(r.coverage_type, tDetail)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 ? <p className="text-sm text-aistroyka-text-secondary">{tDetail("noAftercareRequestsYet")}</p> : null}
    </div>
  );
}
