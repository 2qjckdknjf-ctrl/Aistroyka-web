"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui";
import { serviceRequestStatusBadgeClass } from "./statusBadgeStyles";
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
  return tDetail("reviewNeeded");
}

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/service-requests`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

export function ServiceRequestsProjectTab({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverage, setCoverage] = useState<"warranty_covered" | "warranty_review_needed" | "not_warranty">(
    "warranty_review_needed"
  );

  const listQuery = useQuery({
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
          coverage_type: coverage,
          initial_status: "reported",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-service-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-timeline", projectId] });
      setTitle("");
      setDescription("");
      setCoverage("warranty_review_needed");
      setOpen(false);
    },
  });

  if (listQuery.isError) {
    return <p className="p-4 text-sm text-aistroyka-error">{(listQuery.error as Error).message}</p>;
  }

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-aistroyka-text-secondary">
        {tDetail("serviceRequestsProjectHint")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? tDetail("close") : tDetail("newRequest")}
        </Button>
      </div>
      {open ? (
        <Card className="p-3 space-y-2">
          <input
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            placeholder={tDetail("title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            rows={2}
            placeholder={tDetail("description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="block text-xs text-aistroyka-text-secondary">
            {tDetail("coverage")}
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={coverage}
              onChange={(e) => setCoverage(e.target.value as typeof coverage)}
            >
              <option value="warranty_review_needed">{tDetail("warrantyNeedsReview")}</option>
              <option value="warranty_covered">{tDetail("warrantyCovered")}</option>
              <option value="not_warranty">{tDetail("notWarrantyCommercial")}</option>
            </select>
          </label>
          <Button type="button" size="sm" disabled={!title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? tDetail("saving") : tDetail("create")}
          </Button>
          {createMutation.isError ? (
            <p className="text-xs text-aistroyka-error">{(createMutation.error as Error).message}</p>
          ) : null}
        </Card>
      ) : null}

      {listQuery.isPending ? <p className="text-sm text-aistroyka-text-secondary">{tDetail("loading")}</p> : null}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("coverage")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("due")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link
                  href={`/dashboard/projects/${projectId}/service-requests/${r.id}`}
                  className="font-medium text-aistroyka-accent hover:underline"
                >
                  {r.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={`${serviceRequestStatusBadgeClass(r.status)} font-normal`}>{formatPortalStatus(r.status, "serviceRequest", tPortal)}</Badge>
              </TableCell>
              <TableCell>{coverageLabel(r.coverage_type, tDetail)}</TableCell>
              <TableCell>{r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && !listQuery.isPending ? (
        <p className="text-sm text-aistroyka-text-secondary">{tDetail("noAftercareRequestsYet")}</p>
      ) : null}
    </div>
  );
}
