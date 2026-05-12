"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { issueStatusBadgeClass } from "./statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";

interface Issue {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  task_id?: string | null;
  milestone_id?: string | null;
  created_at: string;
}

export function ProjectIssuesPanel({
  projectId,
  query,
}: {
  projectId: string;
  query: { data?: Issue[]; isPending: boolean; isError: boolean };
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const issues = query.data ?? [];
  const openIssues = issues.filter((i) => ["open", "in_review"].includes(i.status));
  const STATUS_OPTIONS = [
    { value: "open", label: tDetail("open") },
    { value: "in_review", label: tDetail("inReview") },
    { value: "resolved", label: tDetail("resolved") },
    { value: "closed", label: tDetail("closed") },
  ];

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
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadIssues")}</p>;

  if (issues.length === 0 && !showCreate) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={tDetail("issues")}
          subtitle={tDetail("noIssuesYet")}
        />
        <Button variant="secondary" className="mt-4" onClick={() => setShowCreate(true)}>
          {tDetail("createIssue")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-aistroyka-text-primary">{tDetail("issues")}</h3>
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
          {tDetail("createIssue")}
        </Button>
      </div>
      <Table aria-label={tDetail("projectIssues")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("actions")}</TableHeaderCell>
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
                <Badge className={issueStatusBadgeClass(i.status)}>{formatPortalStatus(i.status, "issue", tPortal)}</Badge>
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
        <Modal open={true} title={tDetail("createIssue")} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="space-y-3">
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("title")}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tDetail("issueTitle")}
                required
              />
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("descriptionOptional")}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tDetail("describeDefectOrObservation")}
                rows={3}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                {tDetail("cancel")}
              </Button>
              <Button type="submit" disabled={submitting || !title.trim()}>
                {tDetail("create")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
