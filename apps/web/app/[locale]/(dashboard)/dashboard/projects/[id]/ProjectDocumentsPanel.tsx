"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Skeleton,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Select,
  Modal,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { getPublicConfig } from "@/lib/config/public";
import { DocumentApprovalHistory } from "@/components/approvals";

const MEDIA_BUCKET = "media";
const MAX_UPLOAD_MB = 25;

interface ProjectDocument {
  id: string;
  tenant_id: string;
  project_id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  object_path?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface Milestone {
  id: string;
  title: string;
  target_date: string;
  status: string;
}

function fileUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  const base = (getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${objectPath}`;
}

async function fetchDocuments(projectId: string): Promise<ProjectDocument[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function createDocument(
  projectId: string,
  body: { type: string; title: string; description?: string; milestone_id?: string }
): Promise<ProjectDocument> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Create failed");
  }
  const json = await res.json();
  return json.data;
}

async function uploadDocumentFile(
  projectId: string,
  documentId: string,
  file: File
): Promise<{ document: ProjectDocument }> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Upload failed");
  }
  const json = await res.json();
  return json.data;
}

async function updateDocument(
  projectId: string,
  documentId: string,
  body: { status?: string; milestone_id?: string }
): Promise<ProjectDocument> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Update failed");
  }
  const json = await res.json();
  return json.data;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "rejected":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "under_review":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "uploaded":
      return "bg-aistroyka-info/20 text-aistroyka-info";
    case "archived":
      return "bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary";
    default:
      return "bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary";
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    uploaded: "Uploaded",
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    archived: "Archived",
  };
  return map[status] ?? status.replace("_", " ");
}

function typeLabel(type: string): string {
  switch (type) {
    case "act":
      return "Act";
    case "contract":
      return "Contract";
    default:
      return "Document";
  }
}

export function ProjectDocumentsPanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: () => fetchDocuments(projectId),
    enabled: !!projectId,
  });
  const milestonesQuery = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchMilestones(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (body: { type: string; title: string; description?: string; milestone_id?: string }) =>
      createDocument(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setCreateOpen(false);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      uploadDocumentFile(projectId, documentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setUploadDocId(null);
      setUploadError(null);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
    onError: (err) => {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ documentId, body }: { documentId: string; body: { status?: string; milestone_id?: string } }) =>
      updateDocument(projectId, documentId, body),
    onMutate: ({ documentId }) => setUpdatingId(documentId),
    onSettled: () => setUpdatingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    },
  });

  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError)
    return (
      <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadDocuments")}</p>
    );

  const rows = query.data ?? [];
  const milestones = milestonesQuery.data ?? [];
  const pendingDocs = rows.filter((d) => d.status === "under_review");

  return (
    <div className="p-4">
      <input
        ref={uploadInputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const targetId = uploadTargetRef.current;
          if (!f || !targetId) return;
          e.target.value = "";
          if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
            setUploadDocId(targetId);
            setUploadError(`File too large. Max ${MAX_UPLOAD_MB}MB.`);
            return;
          }
          setUploadError(null);
          setUploadDocId(targetId);
          uploadMutation.mutate({ documentId: targetId, file: f });
        }}
        aria-label={tDetail("uploadFile")}
      />
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
          {tDetail("projectDocuments")}
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          aria-label={tDetail("createDocument")}
        >
          {tDetail("createDocument")}
        </Button>
      </div>

      {pendingDocs.length > 0 && (
        <div className="mb-4 rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-muted p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-[220px]">
            <p className="text-sm font-medium text-aistroyka-text-primary">
              {pendingDocs.length} document(s) pending review
            </p>
            <p className="text-xs text-aistroyka-text-tertiary mt-1">
              These are in governance state `under_review`. Use Approve / Reject to complete the
              review cycle.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const first = pendingDocs[0];
              if (!first) return;
              document.getElementById(`document-${first.id}`)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            Jump to pending →
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📄</span>}
          title={tDetail("noDocumentsYet")}
          subtitle={tDetail("createDocumentHint")}
          action={
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              {tDetail("createDocument")}
            </Button>
          }
        />
      ) : (
        <Table aria-label={tDetail("projectDocuments")}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("type")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("file")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("linkedTo")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("actions")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((doc) => {
              const url = fileUrl(doc.object_path);
              const canUpload = doc.status === "draft" && !uploadMutation.isPending;
              const isUploading = uploadDocId === doc.id && uploadMutation.isPending;
              const canSubmitForReview = doc.status === "uploaded" && updatingId !== doc.id;
              const canReview = doc.status === "under_review" && updatingId !== doc.id;

              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div id={`document-${doc.id}`} className="scroll-mt-24">
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>{typeLabel(doc.type)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                        doc.status
                      )}`}
                    >
                      {statusLabel(doc.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aistroyka-accent hover:underline text-sm"
                      >
                        Open
                      </a>
                    ) : canUpload ? (
                      <button
                        type="button"
                        onClick={() => {
                          uploadTargetRef.current = doc.id;
                          uploadInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="text-aistroyka-accent hover:underline text-sm text-left disabled:opacity-50"
                      >
                        {isUploading ? "Uploading…" : "Upload file"}
                      </button>
                    ) : (
                      <span className="text-aistroyka-text-tertiary text-sm">—</span>
                    )}
                    {uploadDocId === doc.id && (uploadMutation.isError || uploadError) && (
                      <p className="text-xs text-aistroyka-error mt-0.5" role="alert">
                        {uploadError ??
                          (uploadMutation.error instanceof Error
                            ? uploadMutation.error.message
                            : "Upload failed")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    {doc.milestone_id ? (
                      <>
                        {milestones.find((m) => m.id === doc.milestone_id)?.title ??
                          doc.milestone_id.slice(0, 8) + "…"}
                      </>
                    ) : doc.report_id ? (
                      <Link
                        href={`/dashboard/reports/${doc.report_id}`}
                        className="text-aistroyka-accent hover:underline font-medium"
                      >
                        Report {doc.report_id.slice(0, 8)}…
                      </Link>
                    ) : doc.task_id ? (
                      <Link
                        href={`/dashboard/tasks/${doc.task_id}`}
                        className="text-aistroyka-accent hover:underline font-medium"
                      >
                        Task {doc.task_id.slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 items-center">
                      {canSubmitForReview ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              documentId: doc.id,
                              body: { status: "under_review" },
                            })
                          }
                          disabled={updatingId === doc.id}
                        >
                          Submit for review
                        </Button>
                      ) : canReview ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              updateMutation.mutate({
                                documentId: doc.id,
                                body: { status: "approved" },
                              })
                            }
                            disabled={updatingId === doc.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              updateMutation.mutate({
                                documentId: doc.id,
                                body: { status: "rejected" },
                              })
                            }
                            disabled={updatingId === doc.id}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-aistroyka-text-tertiary text-sm">—</span>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setHistoryDocId(doc.id)}
                        disabled={uploadMutation.isPending}
                      >
                        History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Modal
        open={historyDocId !== null}
        onClose={() => setHistoryDocId(null)}
        title={tDetail("documentApprovalHistory")}
      >
        {historyDocId ? (
          <DocumentApprovalHistory projectId={projectId} documentId={historyDocId} />
        ) : null}
      </Modal>

      <CreateDocumentModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          createMutation.reset();
        }}
        projectId={projectId}
        milestones={milestones}
        onSubmit={(body) => createMutation.mutate(body)}
        isSubmitting={createMutation.isPending}
        error={
          createMutation.isError && createMutation.error instanceof Error
            ? createMutation.error.message
            : null
        }
      />
    </div>
  );
}

function CreateDocumentModal({
  open,
  onClose,
  projectId,
  milestones,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  milestones: Milestone[];
  onSubmit: (body: { type: string; title: string; description?: string; milestone_id?: string }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [type, setType] = useState<string>("document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestoneId, setMilestoneId] = useState<string>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onSubmit({
      type,
      title: t,
      description: description.trim() || undefined,
      milestone_id: milestoneId || undefined,
    });
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={tDetail("createDocument")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="doc-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tDetail("workCompletionActExample")}
          required
          disabled={isSubmitting}
          error={!title.trim() && error ? error : undefined}
        />
        <div>
          <label
            htmlFor="doc-type"
            className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary"
          >
            Type
          </label>
          <Select
            id="doc-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="document">{tDetail("document")}</option>
            <option value="act">{tDetail("act")}</option>
            <option value="contract">{tDetail("contract")}</option>
          </Select>
        </div>
        <Textarea
          id="doc-description"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tDetail("briefDescriptionOrNotes")}
          disabled={isSubmitting}
          rows={2}
        />
        {milestones.length > 0 && (
          <div>
            <label
              htmlFor="doc-milestone"
              className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary"
            >
              {tDetail("linkToMilestoneOptional")}
            </label>
            <Select
              id="doc-milestone"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">{tDetail("none")}</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.target_date})
                </option>
              ))}
            </Select>
          </div>
        )}
        {error && (
          <p className="text-sm text-aistroyka-error" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {tDetail("cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? tDetail("creating") : tDetail("create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
