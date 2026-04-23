"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { formatStatusLabel, serviceRequestStatusBadgeClass } from "../../statusBadgeStyles";

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
      <Card>
        <Skeleton className="h-40" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">🛠️</span>}
          title="Request unavailable"
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const row = q.data!;
  const options = NEXT[row.status] ?? [];
  const editable = row.status !== "closed";
  const closingWithoutResolve = toStatus === "closed" && row.status !== "resolved";

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/projects/${projectId}?tab=aftercare`} className="text-aistroyka-accent hover:underline text-sm">
        ← Aftercare
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{row.title}</h1>
          <Badge className={serviceRequestStatusBadgeClass(row.status)}>{formatStatusLabel(row.status)}</Badge>
        </div>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          Created by {row.created_by.slice(0, 8)}…
          {row.linked_handover_id ? " · Linked to handover record" : ""}
        </p>
      </Card>

      {editable ? (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Edit</h2>
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
            Warranty / coverage
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={coverage}
              onChange={(e) => setCoverage(e.target.value)}
            >
              <option value="warranty_review_needed">Warranty — needs review</option>
              <option value="warranty_covered">Warranty covered</option>
              <option value="not_warranty">Not warranty / commercial</option>
            </select>
          </label>
          <input
            className="w-full font-mono text-sm rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2"
            placeholder="Assignee user id (optional)"
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
            placeholder="Linked punch list defect id (optional)"
            value={linkedDefect}
            onChange={(e) => setLinkedDefect(e.target.value)}
          />
          <input
            className="w-full font-mono text-sm rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2"
            placeholder="Linked discussion id (optional)"
            value={linkedDiscussion}
            onChange={(e) => setLinkedDiscussion(e.target.value)}
          />
          <Button type="button" size="sm" onClick={() => patchMutation.mutate()} disabled={patchMutation.isPending}>
            Save
          </Button>
        </Card>
      ) : (
        <Card className="p-4">
          {row.description ? <p className="text-sm whitespace-pre-wrap">{row.description}</p> : null}
          {row.resolution_note ? (
            <p className="mt-2 text-sm">
              <span className="font-medium">Resolution:</span> {row.resolution_note}
            </p>
          ) : null}
        </Card>
      )}

      {options.length > 0 && editable ? (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Transition</h2>
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
              placeholder="Resolution note (required)"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
            />
          ) : null}
          <input
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            placeholder={closingWithoutResolve ? "Closure note (required)" : "Internal note (optional)"}
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
            {transitionMutation.isPending ? "Applying…" : "Apply"}
          </Button>
        </Card>
      ) : null}

      <Card className="p-4">
        <h2 className="font-semibold">History</h2>
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
      </Card>
    </div>
  );
}
