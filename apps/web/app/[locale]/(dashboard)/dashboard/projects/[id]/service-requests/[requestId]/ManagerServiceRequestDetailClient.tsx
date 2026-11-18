"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { serviceRequestStatusBadgeClass } from "../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Event = {
  id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  note: string | null;
  created_at: string;
};

type Detail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  coverage_type: string;
  assigned_to: string | null;
  due_date: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  linked_handover_id: string | null;
  linked_defect_id: string | null;
  linked_discussion_id: string | null;
  created_by: string;
  events: Event[];
};

const NEXT: Record<string, string[]> = {
  reported: ["triaged", "in_progress", "closed"],
  triaged: ["in_progress", "closed"],
  in_progress: ["resolved", "triaged", "closed"],
  resolved: ["closed"],
  closed: [],
};

async function fetchDetail(projectId: string, requestId: string): Promise<Detail> {
  const res = await fetch(`/api/v1/projects/${projectId}/service-requests/${requestId}`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  if (j.audience !== "manager") throw new Error("Manager access required");
  return j.data;
}

export function ManagerServiceRequestDetailClient({ projectId, requestId }: { projectId: string; requestId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [toStatus, setToStatus] = useState("");
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverage, setCoverage] = useState("warranty_review_needed");
  const [assignedTo, setAssignedTo] = useState("");
  const [due, setDue] = useState("");
  const [linkedDefect, setLinkedDefect] = useState("");
  const [linkedDiscussion, setLinkedDiscussion] = useState("");

  const q = useQuery({
    queryKey: ["project-service-request", projectId, requestId],
    queryFn: () => fetchDetail(projectId, requestId),
  });

  const d = q.data;
  useEffect(() => {
    if (!d) return;
    setTitle(d.title);
    setDescription(d.description ?? "");
    setCoverage(d.coverage_type);
    setAssignedTo(d.assigned_to ?? "");
    setDue(d.due_date ? d.due_date.slice(0, 10) : "");
    setLinkedDefect(d.linked_defect_id ?? "");
    setLinkedDiscussion(d.linked_discussion_id ?? "");
    const opts = NEXT[d.status] ?? [];
    setToStatus(opts[0] ?? "");
  }, [d]);

  const patchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          coverage_type: coverage,
          assigned_to: assignedTo.trim() || null,
          due_date: due.trim() || null,
          linked_defect_id: linkedDefect.trim() || null,
          linked_discussion_id: linkedDiscussion.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-service-request", projectId, requestId] });
      queryClient.invalidateQueries({ queryKey: ["project-service-requests", projectId] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string | null> = { to_status: toStatus, note: note.trim() || null };
      if (toStatus === "resolved") body.resolution_note = resolutionNote.trim() || "";
      const res = await fetch(`/api/v1/projects/${projectId}/service-requests/${requestId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Transition failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-service-request", projectId, requestId] });
      queryClient.invalidateQueries({ queryKey: ["project-service-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-timeline", projectId] });
      setNote("");
      setResolutionNote("");
    },
  });

  if (q.isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton className="h-40" />
      </DashboardGlassCard>
    );
  }

  if (q.isError) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">🛠️</span>}
          title={tDetail("requestUnavailable")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </DashboardGlassCard>
    );
  }

  const row = q.data!;
  const options = NEXT[row.status] ?? [];
  const editable = row.status !== "closed";
  const closingWithoutResolve = toStatus === "closed" && row.status !== "resolved";

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/projects/${projectId}?tab=aftercare`} className="text-aistroyka-accent hover:underline text-sm">
        {tDetail("backToAftercare")}
      </Link>
      <DashboardGlassCard className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{row.title}</h1>
          <Badge className={serviceRequestStatusBadgeClass(row.status)}>{formatPortalStatus(row.status, "serviceRequest", tPortal)}</Badge>
        </div>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          {tDetail("createdBy")} {row.created_by.slice(0, 8)}…
          {row.linked_handover_id ? ` · ${tDetail("linkedToHandoverRecord")}` : ""}
        </p>
      </DashboardGlassCard>

      {editable ? (
        <DashboardGlassCard className="p-4 space-y-3">
          <h2 className="font-semibold">{tDetail("edit")}</h2>
          <input
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="block text-xs text-aistroyka-text-secondary">
            {tDetail("warrantyCoverage")}
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={coverage}
              onChange={(e) => setCoverage(e.target.value)}
            >
              <option value="warranty_review_needed">{tDetail("warrantyNeedsReview")}</option>
              <option value="warranty_covered">{tDetail("warrantyCovered")}</option>
              <option value="not_warranty">{tDetail("notWarrantyCommercial")}</option>
            </select>
          </label>
          <input
            className="w-full font-mono text-sm rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2"
            placeholder={tDetail("assigneeUserIdOptional")}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
          <input
            type="date"
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <input
            className="w-full font-mono text-sm rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2"
            placeholder={tDetail("linkedPunchListDefectIdOptional")}
            value={linkedDefect}
            onChange={(e) => setLinkedDefect(e.target.value)}
          />
          <input
            className="w-full font-mono text-sm rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2"
            placeholder={tDetail("linkedDiscussionIdOptional")}
            value={linkedDiscussion}
            onChange={(e) => setLinkedDiscussion(e.target.value)}
          />
          <Button type="button" size="sm" onClick={() => patchMutation.mutate()} disabled={patchMutation.isPending}>
            {tDetail("save")}
          </Button>
        </DashboardGlassCard>
      ) : (
        <DashboardGlassCard className="p-4">
          {row.description ? <p className="text-sm whitespace-pre-wrap">{row.description}</p> : null}
          {row.resolution_note ? (
            <p className="mt-2 text-sm">
              <span className="font-medium">{tDetail("resolution")}:</span> {row.resolution_note}
            </p>
          ) : null}
        </DashboardGlassCard>
      )}

      {options.length > 0 && editable ? (
        <DashboardGlassCard className="p-4 space-y-3">
          <h2 className="font-semibold">{tDetail("transition")}</h2>
          <select
            className="w-full max-w-md rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            value={toStatus}
            onChange={(e) => setToStatus(e.target.value)}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {toStatus === "resolved" ? (
            <textarea
              className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={2}
              placeholder={tDetail("resolutionNoteRequired")}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
            />
          ) : null}
          <input
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            placeholder={closingWithoutResolve ? tDetail("closureNoteRequired") : tDetail("internalNoteOptional")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={
              !toStatus ||
              transitionMutation.isPending ||
              (toStatus === "resolved" && !resolutionNote.trim()) ||
              (closingWithoutResolve && !note.trim())
            }
            onClick={() => transitionMutation.mutate()}
          >
            {transitionMutation.isPending ? tDetail("applying") : tDetail("apply")}
          </Button>
        </DashboardGlassCard>
      ) : null}

      <DashboardGlassCard className="p-4">
        <h2 className="font-semibold">{tDetail("history")}</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {row.events.map((e) => (
            <li key={e.id} className="rounded border border-aistroyka-border-subtle p-2">
              <span className="text-xs text-aistroyka-text-tertiary">
                {e.from_status ?? "—"} → {e.to_status} · {e.actor_user_id.slice(0, 8)}… · {new Date(e.created_at).toLocaleString()}
              </span>
              {e.note ? <p className="mt-1">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      </DashboardGlassCard>
    </div>
  );
}
