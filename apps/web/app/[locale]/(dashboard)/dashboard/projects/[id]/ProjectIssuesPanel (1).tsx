"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Skeleton,
  EmptyState,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Modal,
  Input,
  Textarea,
  Select,
} from "@/components/ui";
import { formatStatusLabel, issueStatusBadgeClass } from "./statusBadgeStyles";

interface Issue {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  task_id?: string | null;
  milestone_id?: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function ProjectIssuesPanel({
  projectId,
  query,
}: {
  projectId: string;
  query: { data?: Issue[]; isPending: boolean; isError: boolean };
}) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const issues = query.data ?? [];
  const openIssues = issues.filter((i) => ["open", "in_review"].includes(i.status));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setShowCreate(false);
        queryClient.invalidateQueries({ queryKey: ["project-issues", projectId] });
        queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function patchStatus(issueId: string, status: string) {
    const res = await fetch(`/api/v1/projects/${projectId}/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["project-issues", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
    }
  }

  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">Failed to load issues.</p>;

  if (issues.length === 0 && !showCreate) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title="Issues"
          subtitle="No issues yet. Create an issue to track defects or observations."
        />
        <Button variant="secondary" className="mt-4" onClick={() => setShowCreate(true)}>
          Create issue
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-aistroyka-text-primary">Issues</h3>
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
          Create issue
        </Button>
      </div>
      <Table aria-label="Project issues">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                <span className="font-medium text-aistroyka-text-primary">{i.title}</span>
                {i.description && (
                  <p className="text-xs text-aistroyka-text-tertiary mt-0.5 line-clamp-1">{i.description}</p>
                )}
              </TableCell>
              <TableCell>
                <Badge className={issueStatusBadgeClass(i.status)}>{formatStatusLabel(i.status)}</Badge>
              </TableCell>
              <TableCell className="text-aistroyka-text-secondary">
                {new Date(i.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {["open", "in_review"].includes(i.status) && (
                  <Select
                    value={i.status}
                    onChange={(e) => patchStatus(i.id, e.target.value)}
                    className="text-sm w-auto inline-block"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showCreate && (
        <Modal open={true} title="Create issue" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="space-y-3">
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                required
              />
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                Description (optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the defect or observation"
                rows={3}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !title.trim()}>
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
