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
  decision_comment?: string | null;
  decided_by?: string | null;
  client_visible?: boolean;
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
  body: { type: string; title: string; description?: string; milestone_id?: string },
  createFailedLabel: string
): Promise<ProjectDocument> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? createFailedLabel);
  }
  const json = await res.json();
  return json.data;
}

async function uploadDocumentFile(
  projectId: string,
  documentId: string,
  file: File,
  uploadFailedLabel: string
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
    throw new Error((j as { error?: string }).error ?? uploadFailedLabel);
  }
  const json = await res.json();
  return json.data;
}

async function updateDocument(
  projectId: string,
  documentId: string,
  body: {
    status?: string;
    milestone_id?: string;
    decision_comment?: string | null;
    client_visible?: boolean;
  },
  updateFailedLabel: string
): Promise<ProjectDocument> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? updateFailedLabel);
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
    case "changes_requested":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
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

function statusLabel(status: string, t: ReturnType<typeof useTranslations>): string {
  switch (status) {
    case "draft":
      return t("status.draft");
    case "uploaded":
      return t("status.uploaded");
    case "under_review":
      return t("status.under_review");
    case "approved":
      return t("status.approved");
    case "rejected":
      return t("status.rejected");
    case "changes_requested":
      return t("status.changes_requested");
    case "archived":
      return t("status.archived");
    default:
      return status.replace(/_/g, " ");
  }
}

function typeLabel(type: string, t: ReturnType<typeof useTranslations>): string {
  switch (type) {
    case "act":
      return t("type.act");
    case "contract":
      return t("type.contract");
    default:
      return t("type.document");
  }
}

export function ProjectDocumentsPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("projects.documents");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [requestChangesDocId, setRequestChangesDocId] = useState<string | null>(null);
  const [requestChangesNote, setRequestChangesNote] = useState("");
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
      createDocument(projectId, body, t("errors.createFailed")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setCreateOpen(false);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      uploadDocumentFile(projectId, documentId, file, t("uploadFailed")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setUploadDocId(null);
      setUploadError(null);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
    onError: (err) => {
      setUploadError(err instanceof Error ? err.message : t("uploadFailed"));
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      body,
    }: {
      documentId: string;
      body: {
        status?: string;
        milestone_id?: string;
        decision_comment?: string | null;
        client_visible?: boolean;
      };
    }) => updateDocument(projectId, documentId, body, t("errors.updateFailed")),
    onMutate: ({ documentId }) => setUpdatingId(documentId),
    onSettled: () => setUpdatingId(null),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      if (vars.body.status === "changes_requested") {
        setRequestChangesDocId(null);
        setRequestChangesNote("");
      }
    },
  });

  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError)
    return (
      <p className="text-aistroyka-text-secondary p-4">{t("loadError")}</p>
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
            setUploadError(t("fileTooLarge", { maxMb: MAX_UPLOAD_MB }));
            return;
          }
          setUploadError(null);
          setUploadDocId(targetId);
          uploadMutation.mutate({ documentId: targetId, file: f });
        }}
        aria-label={t("uploadFileAria")}
      />
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
          {t("title")}
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          aria-label={t("createDocumentAria")}
        >
          {t("createDocument")}
        </Button>
      </div>

      {pendingDocs.length > 0 && (
        <div className="mb-4 rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-muted p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-[220px]">
            <p className="text-sm font-medium text-aistroyka-text-primary">
              {t("pendingReviewTitle", { count: pendingDocs.length })}
            </p>
            <p className="text-xs text-aistroyka-text-tertiary mt-1">
              {t("pendingReviewHint")}
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
            {t("jumpToPending")}
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📄</span>}
          title={t("emptyTitle")}
          subtitle={t("emptySubtitle")}
          action={
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              {t("createDocument")}
            </Button>
          }
        />
      ) : (
        <Table aria-label={t("tableAria")}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("colTitle")}</TableHeaderCell>
              <TableHeaderCell>{t("colType")}</TableHeaderCell>
              <TableHeaderCell>{t("colStatus")}</TableHeaderCell>
              <TableHeaderCell>{t("colFile")}</TableHeaderCell>
              <TableHeaderCell>{t("colLinked")}</TableHeaderCell>
              <TableHeaderCell>{t("colCreated")}</TableHeaderCell>
              <TableHeaderCell>{t("colClient")}</TableHeaderCell>
              <TableHeaderCell>{t("colActions")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((doc) => {
              const url = fileUrl(doc.object_path);
              const canUpload = doc.status === "draft" && !uploadMutation.isPending;
              const isUploading = uploadDocId === doc.id && uploadMutation.isPending;
              const canSubmitForReview = doc.status === "uploaded" && updatingId !== doc.id;
              const canResubmitForReview = doc.status === "changes_requested" && updatingId !== doc.id;
              const canReview = doc.status === "under_review" && updatingId !== doc.id;

              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div id={`document-${doc.id}`} className="scroll-mt-24">
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>{typeLabel(doc.type, t)}</TableCell>
                  <TableCell>
                    <div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                          doc.status
                        )}`}
                      >
                        {statusLabel(doc.status, t)}
                      </span>
                      {doc.decision_comment &&
                        ["approved", "rejected", "changes_requested"].includes(doc.status) && (
                          <p className="text-xs text-aistroyka-text-secondary mt-1 max-w-[200px] truncate" title={doc.decision_comment}>
                            {doc.decision_comment}
                          </p>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aistroyka-accent hover:underline text-sm"
                      >
                        {t("open")}
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
                        {isUploading ? t("uploading") : t("uploadFile")}
                      </button>
                    ) : (
                      <span className="text-aistroyka-text-tertiary text-sm">{t("dash")}</span>
                    )}
                    {uploadDocId === doc.id && (uploadMutation.isError || uploadError) && (
                      <p className="text-xs text-aistroyka-error mt-0.5" role="alert">
                        {uploadError ??
                          (uploadMutation.error instanceof Error
                            ? uploadMutation.error.message
                            : t("uploadFailed"))}
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
                        {t("reportLink", { id: `${doc.report_id.slice(0, 8)}…` })}
                      </Link>
                    ) : doc.task_id ? (
                      <Link
                        href={`/dashboard/tasks/${doc.task_id}`}
                        className="text-aistroyka-accent hover:underline font-medium"
                      >
                        {t("taskLink", { id: `${doc.task_id.slice(0, 8)}…` })}
                      </Link>
                    ) : (
                      t("dash")
                    )}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-1.5 text-xs text-aistroyka-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!doc.client_visible}
                        onChange={() =>
                          updateMutation.mutate({
                            documentId: doc.id,
                            body: { client_visible: !doc.client_visible },
                          })
                        }
                        disabled={updatingId === doc.id}
                      />
                      {t("clientVisibleShort")}
                    </label>
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
                          {t("submitForReview")}
                        </Button>
                      ) : canResubmitForReview ? (
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
                          {t("resubmitForReview")}
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
                            {t("approve")}
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
                            {t("reject")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setRequestChangesDocId(doc.id);
                              setRequestChangesNote("");
                            }}
                            disabled={updatingId === doc.id}
                          >
                            {t("requestChanges")}
                          </Button>
                        </>
                      ) : (
                        <span className="text-aistroyka-text-tertiary text-sm">{t("dash")}</span>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setHistoryDocId(doc.id)}
                        disabled={uploadMutation.isPending}
                      >
                        {t("history")}
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
        title={t("modalHistoryTitle")}
      >
        {historyDocId ? (
          <DocumentApprovalHistory projectId={projectId} documentId={historyDocId} />
        ) : null}
      </Modal>

      <Modal
        open={requestChangesDocId !== null}
        onClose={() => {
          setRequestChangesDocId(null);
          setRequestChangesNote("");
        }}
        title={t("modalRequestChangesTitle")}
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-aistroyka-text-primary">
            {t("decisionCommentLabel")}
          </label>
          <Textarea
            value={requestChangesNote}
            onChange={(e) => setRequestChangesNote(e.target.value)}
            placeholder={t("decisionCommentPlaceholder")}
            rows={4}
            className="w-full"
          />
          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setRequestChangesDocId(null);
                setRequestChangesNote("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!requestChangesDocId || updatingId === requestChangesDocId}
              onClick={() => {
                if (!requestChangesDocId) return;
                const note = requestChangesNote.trim();
                updateMutation.mutate({
                  documentId: requestChangesDocId,
                  body: {
                    status: "changes_requested",
                    ...(note ? { decision_comment: note } : {}),
                  },
                });
              }}
            >
              {t("confirmRequestChanges")}
            </Button>
          </div>
        </div>
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
  projectId: _projectId,
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
  const t = useTranslations("projects.documents");
  const tCommon = useTranslations("common");
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
    <Modal open={open} onClose={onClose} title={t("modalCreateTitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="doc-title"
          label={t("formTitle")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("placeholderTitle")}
          required
          disabled={isSubmitting}
          error={!title.trim() && error ? error : undefined}
        />
        <div>
          <label
            htmlFor="doc-type"
            className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary"
          >
            {t("formType")}
          </label>
          <Select
            id="doc-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="document">{t("type.document")}</option>
            <option value="act">{t("type.act")}</option>
            <option value="contract">{t("type.contract")}</option>
          </Select>
        </div>
        <Textarea
          id="doc-description"
          label={t("formDescriptionOptional")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("placeholderDescription")}
          disabled={isSubmitting}
          rows={2}
        />
        {milestones.length > 0 && (
          <div>
            <label
              htmlFor="doc-milestone"
              className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary"
            >
              {t("formMilestoneOptional")}
            </label>
            <Select
              id="doc-milestone"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">{t("milestoneNone")}</option>
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
            {tCommon("cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? t("creating") : t("create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
