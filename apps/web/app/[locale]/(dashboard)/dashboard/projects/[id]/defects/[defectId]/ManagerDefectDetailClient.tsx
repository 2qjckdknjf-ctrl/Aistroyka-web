"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { defectStatusBadgeClass, formatStatusLabel } from "../../statusBadgeStyles";

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
  is_blocking: boolean;
  assigned_to: string | null;
  due_date: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  linked_milestone_id: string | null;
  linked_document_id: string | null;
  linked_discussion_id: string | null;
  linked_request_id: string | null;
  created_by: string;
  events: Event[];
};

const NEXT: Record<string, string[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["ready_for_verification", "open", "closed"],
  ready_for_verification: ["resolved", "in_progress"],
  resolved: ["closed"],
  closed: [],
};

async function fetchDetail(projectId: string, defectId: string): Promise<Detail> {
  const res = await fetch(`/api/v1/projects/${projectId}/defects/${defectId}`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  if (j.audience !== "manager") throw new Error("Manager access required");
  return j.data;
}

export function ManagerDefectDetailClient({ projectId, defectId }: { projectId: string; defectId: string }) {
  const queryClient = useQueryClient();
  const [toStatus, setToStatus] = useState("");
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [due, setDue] = useState("");

  const q = useQuery({
    queryKey: ["project-defect", projectId, defectId],
    queryFn: () => fetchDetail(projectId, defectId),
  });

  const d = q.data;
  useEffect(() => {
    if (!d) return;
    setTitle(d.title);
    setDescription(d.description ?? "");
    setBlocking(d.is_blocking);
    setDue(d.due_date ? d.due_date.slice(0, 10) : "");
    const opts = NEXT[d.status] ?? [];
    setToStatus(opts[0] ?? "");
  }, [d]);

  const patchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/defects/${defectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_blocking: blocking,
          due_date: due.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-defect", projectId, defectId] });
      queryClient.invalidateQueries({ queryKey: ["project-defects", projectId] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string | null> = { to_status: toStatus, note: note.trim() || null };
      if (toStatus === "resolved") body.resolution_note = resolutionNote.trim() || "";
      const res = await fetch(`/api/v1/projects/${projectId}/defects/${defectId}/transition`, {
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
      queryClient.invalidateQueries({ queryKey: ["project-defect", projectId, defectId] });
      queryClient.invalidateQueries({ queryKey: ["project-defects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-handover", projectId] });
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
          icon={<span className="text-2xl">📌</span>}
          title="Defect unavailable"
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const row = q.data!;
  const options = NEXT[row.status] ?? [];
  const editable = row.status !== "closed";

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/projects/${projectId}?tab=defects`} className="text-aistroyka-accent hover:underline text-sm">
        ← Punch list
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{row.title}</h1>
          <Badge className={defectStatusBadgeClass(row.status)}>{formatStatusLabel(row.status)}</Badge>
        </div>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          Created by {row.created_by.slice(0, 8)}… {row.is_blocking ? "· Blocking handover" : ""}
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
            Blocks handover
          </label>
          <input
            type="date"
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            value={due}
            onChange={(e) => setDue(e.target.value)}
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
            placeholder="Internal note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={!toStatus || transitionMutation.isPending || (toStatus === "resolved" && !resolutionNote.trim())}
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
