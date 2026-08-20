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
import { ProjectProofPackPanel } from "./ProjectProofPackPanel";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { translateApiError } from "@/lib/i18n/api-error-messages";
import {
  DOCUMENT_FOLDER_TYPES,
  countDocumentsByFolder,
  countPendingDocumentsInFolder,
  filterDocumentsByFolder,
  type DocumentFolderFilter,
} from "./documents-workspace.utils";

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
  created_at: string;
  updated_at: string;
}

interface Milestone {
  id: string;
  title: string;
  target_date: string;
  status: string;
}

interface ReportSummary {
  id: string;
  status: string;
  created_at: string;
}

interface TaskSummary {
  id: string;
  title: string;
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

async function fetchReports(projectId: string): Promise<ReportSummary[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/reports?limit=100&offset=0`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchTasks(projectId: string): Promise<TaskSummary[]> {
  const res = await fetch(`/api/v1/tasks?project_id=${encodeURIComponent(projectId)}&limit=100&offset=0`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function createDocument(
  projectId: string,
  body: {
    type: string;
    title: string;
    description?: string;
    report_id?: string;
    task_id?: string;
    milestone_id?: string;
  }
): Promise<ProjectDocument> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "CREATE_FAILED");
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
    throw new Error((j as { error?: string }).error ?? "UPLOAD_FAILED");
  }
  const json = await res.json();
  return json.data;
}

async function updateDocument(
  projectId: string,
  documentId: string,
  body: {
    status?: string;
    report_id?: string;
    task_id?: string;
    milestone_id?: string;
    decision_comment?: string;
  }
): Promise<ProjectDocument> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "UPDATE_FAILED");
  }
  const json = await res.json();
  return json.data;
}

function fileNameFromObjectPath(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  const parts = objectPath.split("/");
  const fileName = parts[parts.length - 1];
  return fileName || objectPath;
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

function typeLabel(type: string, tDetail: (key: string) => string): string {
  switch (type) {
    case "act":
      return tDetail("act");
    case "contract":
      return tDetail("contract");
    default:
      return tDetail("document");
  }
}

function formatDocumentError(
  message: string,
  tDetail: (key: string) => string,
  tApi: (key: string) => string
): string {
  switch (message) {
    case "CREATE_FAILED":
      return `${tDetail("failed")}: ${tDetail("createDocument")}`;
    case "UPDATE_FAILED":
      return tDetail("updateFailed");
    case "UPLOAD_FAILED":
      return tDetail("uploadFailed");
    case "invalid_status_transition":
      return tDetail("updateFailed");
    case "invalid_task_linkage":
    case "invalid_report_linkage":
    case "invalid_milestone_linkage":
      return tApi("invalidEntityLinkage");
    default:
      return translateApiError(message, tApi);
  }
}

export function ProjectDocumentsPanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const tApi = useTranslations("apiErrors");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateErrorById, setUpdateErrorById] = useState<Record<string, string>>({});
  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<{ documentId: string; status: "approved" | "rejected" } | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [folderFilter, setFolderFilter] = useState<DocumentFolderFilter>("all");
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
  const reportsQuery = useQuery({
    queryKey: ["project-reports-for-doc-linkage", projectId],
    queryFn: () => fetchReports(projectId),
    enabled: !!projectId,
  });
  const tasksQuery = useQuery({
    queryKey: ["project-tasks-for-doc-linkage", projectId],
    queryFn: () => fetchTasks(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (body: {
      type: string;
      title: string;
      description?: string;
      report_id?: string;
      task_id?: string;
      milestone_id?: string;
    }) => createDocument(projectId, body),
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
      setUploadError(err instanceof Error ? err.message : "UPLOAD_FAILED");
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      body,
    }: {
      documentId: string;
      body: { status?: string; report_id?: string; task_id?: string; milestone_id?: string; decision_comment?: string };
    }) =>
      updateDocument(projectId, documentId, body),
    onMutate: ({ documentId }) => {
      setUpdatingId(documentId);
      setUpdateErrorById((prev) => ({ ...prev, [documentId]: "" }));
    },
    onError: (error, variables) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "UPDATE_FAILED";
      setUpdateErrorById((prev) => ({ ...prev, [variables.documentId]: message }));
    },
    onSettled: () => {
      setUpdatingId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setDecisionTarget(null);
      setDecisionComment("");
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
  const folderCounts = countDocumentsByFolder(rows);
  const visibleRows = filterDocumentsByFolder(rows, folderFilter);
  const pendingInFolder = countPendingDocumentsInFolder(rows, folderFilter);

  const folderChipLabel = (folder: DocumentFolderFilter): string => {
    switch (folder) {
      case "all":
        return tDetail("documentsFolderAll");
      case "act":
        return tDetail("act");
      case "contract":
        return tDetail("contract");
      case "document":
        return tDetail("document");
      default: {
        const _exhaustive: never = folder;
        return _exhaustive;
      }
    }
  };

  return (
    <div className="p-4">
      <ProjectProofPackPanel projectId={projectId} />
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
            setUploadError(`${tDetail("fileTooLargeMax")} ${MAX_UPLOAD_MB}MB.`);
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
        <DashboardGlassCard className="mb-4 border-l-4 border-l-aistroyka-warning" contentClassName="flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="min-w-[220px]">
            <p className="text-sm font-medium text-aistroyka-text-primary">
              {pendingDocs.length} {tDetail("documentsPendingReview")}
            </p>
            <p className="text-xs text-aistroyka-text-tertiary mt-1">
              {tDetail("governanceUnderReviewHint")}
              {folderFilter !== "all" && pendingInFolder > 0
                ? ` · ${pendingInFolder} ${tDetail("documentsPendingInFolder")}`
                : null}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const first = (folderFilter === "all" ? pendingDocs : visibleRows.filter((d) => d.status === "under_review"))[0];
              if (!first) return;
              document.getElementById(`document-${first.id}`)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            {tDetail("jumpToPendingArrow")}
          </Button>
        </DashboardGlassCard>
      )}

      {rows.length > 0 ? (
        <div
          role="group"
          aria-label={tDetail("documentsFolders")}
          className="mb-4 flex flex-wrap gap-2"
        >
          {(["all", ...DOCUMENT_FOLDER_TYPES] as DocumentFolderFilter[]).map((folder) => {
            const selected = folderFilter === folder;
            return (
              <button
                key={folder}
                type="button"
                aria-pressed={selected}
                onClick={() => setFolderFilter(folder)}
                className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-lg)] border px-3 text-aistroyka-caption font-medium transition-colors ${
                  selected
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:border-aistroyka-accent/40 hover:text-aistroyka-text-primary"
                }`}
              >
                {folderChipLabel(folder)}
                <span className="ml-1 tabular-nums text-aistroyka-text-tertiary">({folderCounts[folder]})</span>
              </button>
            );
          })}
        </div>
      ) : null}

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
      ) : visibleRows.length === 0 ? (
        <DashboardGlassCard>
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{tDetail("noDocumentsInFolder")}</p>
        </DashboardGlassCard>
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
            {visibleRows.map((doc) => {
              const url = fileUrl(doc.object_path);
              const fileName = fileNameFromObjectPath(doc.object_path);
              const canUpload = doc.status === "draft" && !uploadMutation.isPending;
              const isUploading = uploadDocId === doc.id && uploadMutation.isPending;
              const canSubmitForReview =
                (doc.status === "draft" || doc.status === "uploaded" || doc.status === "changes_requested") &&
                updatingId !== doc.id;
              const canReview = doc.status === "under_review" && updatingId !== doc.id;
              const canArchive =
                (doc.status === "draft" ||
                  doc.status === "uploaded" ||
                  doc.status === "under_review" ||
                  doc.status === "approved" ||
                  doc.status === "rejected" ||
                  doc.status === "changes_requested") &&
                updatingId !== doc.id;

              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div id={`document-${doc.id}`} className="scroll-mt-24">
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>{typeLabel(doc.type, tDetail)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                        doc.status
                      )}`}
                    >
                      {formatPortalStatus(doc.status, "document", tPortal)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {url ? (
                      <div className="flex flex-col gap-1">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-aistroyka-accent hover:underline text-sm"
                        >
                          {tDetail("open")}
                        </a>
                        {fileName ? (
                          <span className="text-aistroyka-text-tertiary text-xs break-all">
                            {fileName}
                          </span>
                        ) : null}
                      </div>
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
                        {isUploading ? tDetail("uploading") : tDetail("uploadFile")}
                      </button>
                    ) : (
                      <span className="text-aistroyka-text-tertiary text-sm">—</span>
                    )}
                    {uploadDocId === doc.id && (uploadMutation.isError || uploadError) && (
                      <p className="text-xs text-aistroyka-error mt-0.5" role="alert">
                        {formatDocumentError(
                          uploadError ??
                            (uploadMutation.error instanceof Error
                              ? uploadMutation.error.message
                              : "UPLOAD_FAILED"),
                          tDetail,
                          tApi
                        )}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    <div className="flex flex-col gap-1">
                      {doc.milestone_id ? (
                        <span>
                          {tDetail("milestone")}:{" "}
                          {milestones.find((m) => m.id === doc.milestone_id)?.title ??
                            doc.milestone_id.slice(0, 8) + "…"}
                        </span>
                      ) : null}
                      {doc.report_id ? (
                        <Link
                          href={`/dashboard/reports/${doc.report_id}`}
                          className="text-aistroyka-accent hover:underline font-medium"
                        >
                          {tDetail("report")} {doc.report_id.slice(0, 8)}…
                        </Link>
                      ) : null}
                      {doc.task_id ? (
                        <Link
                          href={`/dashboard/tasks/${doc.task_id}`}
                          className="text-aistroyka-accent hover:underline font-medium"
                        >
                          {tDetail("task")} {doc.task_id.slice(0, 8)}…
                        </Link>
                      ) : null}
                      {!doc.milestone_id && !doc.report_id && !doc.task_id ? "—" : null}
                    </div>
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
                          {tDetail("submitForReview")}
                        </Button>
                      ) : canReview ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setDecisionTarget({ documentId: doc.id, status: "approved" });
                              setDecisionComment("");
                            }}
                            disabled={updatingId === doc.id}
                          >
                            {tDetail("approve")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setDecisionTarget({ documentId: doc.id, status: "rejected" });
                              setDecisionComment("");
                            }}
                            disabled={updatingId === doc.id}
                          >
                            {tDetail("reject")}
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
                        {tDetail("history")}
                      </Button>
                      {canArchive ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              documentId: doc.id,
                              body: { status: "archived" },
                            })
                          }
                          disabled={updatingId === doc.id}
                        >
                          {tDetail("archived")}
                        </Button>
                      ) : null}
                    </div>
                    {updateErrorById[doc.id] ? (
                      <p className="mt-1 text-xs text-aistroyka-error" role="alert">
                        {formatDocumentError(updateErrorById[doc.id], tDetail, tApi)}
                      </p>
                    ) : null}
                    {doc.decision_comment ? (
                      <p className="mt-1 text-xs text-aistroyka-text-tertiary">
                        {tDetail("commentOptional")}: {doc.decision_comment}
                      </p>
                    ) : null}
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
        milestones={milestones}
        reports={reportsQuery.data ?? []}
        tasks={tasksQuery.data ?? []}
        onSubmit={(body) => createMutation.mutate(body)}
        isSubmitting={createMutation.isPending}
        error={
          createMutation.isError && createMutation.error instanceof Error
            ? formatDocumentError(createMutation.error.message, tDetail, tApi)
            : null
        }
      />
      <DecisionCommentModal
        open={decisionTarget !== null}
        isSubmitting={updateMutation.isPending}
        action={decisionTarget?.status ?? "approved"}
        comment={decisionComment}
        onCommentChange={setDecisionComment}
        onClose={() => {
          setDecisionTarget(null);
          setDecisionComment("");
        }}
        onSubmit={() => {
          if (!decisionTarget) return;
          updateMutation.mutate({
            documentId: decisionTarget.documentId,
            body: {
              status: decisionTarget.status,
              decision_comment: decisionComment.trim() || undefined,
            },
          });
        }}
      />
    </div>
  );
}

function CreateDocumentModal({
  open,
  onClose,
  milestones,
  reports,
  tasks,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  milestones: Milestone[];
  reports: ReportSummary[];
  tasks: TaskSummary[];
  onSubmit: (body: {
    type: string;
    title: string;
    description?: string;
    report_id?: string;
    task_id?: string;
    milestone_id?: string;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const [type, setType] = useState<string>("document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportId, setReportId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState<string>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onSubmit({
      type,
      title: t,
      description: description.trim() || undefined,
      report_id: reportId || undefined,
      task_id: taskId || undefined,
      milestone_id: milestoneId || undefined,
    });
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={tDetail("createDocument")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="doc-title"
          label={tDetail("title")}
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
            {tDetail("type")}
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
          label={tDetail("descriptionOptional")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tDetail("briefDescriptionOrNotes")}
          disabled={isSubmitting}
          rows={2}
        />
        {reports.length > 0 && (
          <Select
            id="doc-report"
            label={tDetail("report")}
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">{tDetail("none")}</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.id.slice(0, 8)}… ({formatPortalStatus(report.status, "report", tPortal)})
              </option>
            ))}
          </Select>
        )}
        {tasks.length > 0 && (
          <Select
            id="doc-task"
            label={tDetail("task")}
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">{tDetail("none")}</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </Select>
        )}
        {milestones.length > 0 && (
          <Select
            id="doc-milestone"
            label={tDetail("linkToMilestoneOptional")}
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

function DecisionCommentModal({
  open,
  action,
  comment,
  isSubmitting,
  onCommentChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  action: "approved" | "rejected";
  comment: string;
  isSubmitting: boolean;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={action === "approved" ? tDetail("approve") : tDetail("reject")}
    >
      <div className="space-y-3">
        <Textarea
          id="doc-decision-comment"
          label={tDetail("commentOptional")}
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder={tDetail("addShortCommentOrReason")}
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {tDetail("cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? tDetail("loading") : tDetail("apply")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
