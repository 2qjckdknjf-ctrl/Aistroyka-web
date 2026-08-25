"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  LayoutGrid,
  List,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { EmptyState, Skeleton } from "@/components/ui";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import {
  countDocumentsByFolder,
  filterDocumentsByFolder,
  type DocumentFolderFilter,
} from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/documents-workspace.utils";
import {
  createProjectDocument,
  fetchProjectDocuments,
  fileNameFromObjectPath,
  PROJECT_DOCUMENTS_MAX_UPLOAD_MB,
  projectDocumentFileUrl,
  uploadProjectDocumentFile,
  updateProjectDocument,
  type ProjectDocumentRow,
} from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/project-documents.api";
import { CanonCreateDocumentModal } from "./CanonCreateDocumentModal";
import { CanonPageHeader } from "./CanonPageHeader";

type DocTab = DocumentFolderFilter;

function statusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "canon-risk-badge canon-risk-badge--low";
    case "rejected":
      return "canon-risk-badge canon-risk-badge--high";
    case "under_review":
      return "canon-risk-badge canon-risk-badge--medium";
    default:
      return "canon-risk-badge";
  }
}

function DocumentPreviewPane({
  projectId,
  doc,
  onClose,
  mobile,
  onDocumentUpdated,
}: {
  projectId: string;
  doc: ProjectDocumentRow;
  onClose?: () => void;
  mobile?: boolean;
  onDocumentUpdated?: () => void;
}) {
  const t = useTranslations("canon");
  const tCommon = useTranslations("common");
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const [shareHint, setShareHint] = useState<string | null>(null);
  const url = projectDocumentFileUrl(doc.object_path);
  const fileName = fileNameFromObjectPath(doc.object_path);

  const intelligenceQuery = useQuery({
    queryKey: ["project-intelligence-doc-preview", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/intelligence`, { credentials: "include" });
      if (!res.ok) throw new Error("INTELLIGENCE_FAILED");
      return res.json() as {
        data?: {
          executiveSummary?: { summary?: string };
          missingEvidenceInsights?: Array<{ title?: string; detail?: string }>;
          recommendations?: Array<{ title?: string; detail?: string }>;
        };
      };
    },
    enabled: !!projectId,
    staleTime: 120_000,
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => updateProjectDocument(projectId, doc.id, { status: "under_review" }),
    onSuccess: () => onDocumentUpdated?.(),
  });

  const intelligenceSummary =
    intelligenceQuery.data?.data?.executiveSummary?.summary ??
    intelligenceQuery.data?.data?.recommendations?.[0]?.detail ??
    intelligenceQuery.data?.data?.missingEvidenceInsights?.[0]?.detail;

  const canSubmitReview =
    doc.object_path && (doc.status === "draft" || doc.status === "uploaded");

  async function handleShare() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareHint(t("docShareCopied"));
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      setShareHint(t("docShareFailed"));
    }
  }

  const shellClass = mobile
    ? "canon-mobile-preview-sheet canon-glass p-4"
    : "canon-glass canon-documents-preview p-4 min-h-[320px]";

  return (
    <div className={shellClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--canon-text-primary)]">{doc.title}</p>
          <span className={statusBadgeClass(doc.status)}>
            {formatPortalStatus(doc.status, "document", tPortal)}
          </span>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="canon-notify-btn shrink-0" aria-label={tCommon("close")}>
            <X size={18} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="mt-4 aspect-[4/3] rounded-xl border border-[var(--canon-border-glass)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
        {url && doc.object_path?.toLowerCase().endsWith(".pdf") ? (
          <iframe src={url} title={doc.title} className="h-full w-full rounded-xl" />
        ) : url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--canon-cyan)] hover:underline">
            {tDetail("open")}
          </a>
        ) : (
          <span className="text-sm text-[var(--canon-text-muted)]">{t("docPreviewEmpty")}</span>
        )}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-[var(--canon-text-muted)]">{tDetail("type")}</dt>
          <dd className="text-[var(--canon-text-primary)]">{doc.type}</dd>
        </div>
        {fileName ? (
          <div>
            <dt className="text-[var(--canon-text-muted)]">{tDetail("file")}</dt>
            <dd className="truncate font-mono text-xs text-[var(--canon-text-secondary)]">{fileName}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[var(--canon-text-muted)]">{tDetail("created")}</dt>
          <dd className="text-[var(--canon-text-primary)]">{new Date(doc.created_at).toLocaleDateString()}</dd>
        </div>
      </dl>

      <div className="canon-ai-panel mt-4 rounded-xl p-3">
        <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("docAiAnalysis")}</p>
        {intelligenceQuery.isPending ? (
          <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{t("docAiLoading")}</p>
        ) : intelligenceSummary ? (
          <p className="mt-2 text-xs text-[var(--canon-text-secondary)]">{intelligenceSummary}</p>
        ) : (
          <p className="mt-2 text-xs text-[var(--canon-text-secondary)]">{t("docAiAnalysisHint")}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/projects/${projectId}?tab=intelligence`}
            className="canon-ghost-btn !text-xs"
          >
            {t("docOpenIntelligence")}
          </Link>
          {canSubmitReview ? (
            <button
              type="button"
              className="canon-gold-btn !text-xs"
              disabled={submitReviewMutation.isPending}
              onClick={() => submitReviewMutation.mutate()}
            >
              {submitReviewMutation.isPending ? tDetail("saving") : t("docSubmitReview")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ProjectDocumentsCanonPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("canon");
  const tCommon = useTranslations("common");
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DocTab>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const refreshDocuments = () => {
    queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
  };

  const query = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: () => fetchProjectDocuments(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      body,
      file,
    }: {
      body: { type: string; title: string; description?: string };
      file: File | null;
    }) => {
      const doc = await createProjectDocument(projectId, body);
      if (!file) return doc;
      if (file.size > PROJECT_DOCUMENTS_MAX_UPLOAD_MB * 1024 * 1024) {
        throw new Error(`${tDetail("fileTooLargeMax")} ${PROJECT_DOCUMENTS_MAX_UPLOAD_MB}MB.`);
      }
      return uploadProjectDocumentFile(projectId, doc.id, file);
    },
    onSuccess: (doc) => {
      refreshDocuments();
      fetch("/api/v1/analysis/process", { method: "POST", credentials: "include" }).catch(() => {});
      setCreateOpen(false);
      setCreateError(null);
      setSelectedId(doc.id);
      setMobilePreviewOpen(true);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : tDetail("failed"));
    },
  });

  const rows = query.data ?? [];
  const folderCounts = countDocumentsByFolder(rows);
  const visibleRows = filterDocumentsByFolder(rows, tab);
  const selected = visibleRows.find((d) => d.id === selectedId) ?? rows.find((d) => d.id === selectedId);

  const folderTree = useMemo(
    () => [
      { id: "all" as DocTab, label: t("docFolderAll"), count: folderCounts.all },
      { id: "document" as DocTab, label: t("docFolderProjectDocs"), count: folderCounts.document },
      { id: "act" as DocTab, label: t("docFolderStructural"), count: folderCounts.act },
      { id: "contract" as DocTab, label: t("docFolderContracts"), count: folderCounts.contract },
    ],
    [folderCounts, t],
  );

  const tabs: { key: DocTab; label: string }[] = [
    { key: "all", label: t("docTabAllFiles", { count: folderCounts.all }) },
    { key: "document", label: t("docTabDocuments") },
    { key: "act", label: t("docTabDrawings") },
    { key: "contract", label: t("docTabModels") },
  ];

  function selectDocument(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobilePreviewOpen(true);
    }
  }

  if (query.isPending) {
    return (
      <div className="p-4">
        <Skeleton lines={6} />
      </div>
    );
  }

  if (query.isError) {
    return <p className="p-4 text-[var(--canon-text-secondary)]">{tDetail("failedLoadDocuments")}</p>;
  }

  return (
    <div className="space-y-4 p-3 sm:p-4 md:p-5">
      <CanonPageHeader
        title={t("documentsTitle")}
        subtitle={t("screen06Label")}
        showFavorite={false}
        actions={
          <>
            <button
              type="button"
              className="canon-ghost-btn !text-xs"
              disabled={!selected?.object_path}
              onClick={async () => {
                const shareUrl = selected ? projectDocumentFileUrl(selected.object_path) : null;
                if (!shareUrl) return;
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setShareHint(t("docShareCopied"));
                  window.setTimeout(() => setShareHint(null), 2500);
                } catch {
                  setShareHint(t("docShareFailed"));
                }
              }}
            >
              <Share2 size={16} aria-hidden />
              <span className="hidden sm:inline">{t("share")}</span>
            </button>
            {shareHint ? (
              <span className="text-xs text-[var(--canon-cyan)]" role="status">{shareHint}</span>
            ) : null}
            <button type="button" className="canon-gold-btn" onClick={() => setCreateOpen(true)}>
              <Upload size={18} aria-hidden />
              {t("uploadFiles")}
            </button>
          </>
        }
      />

      <div className="canon-scroll-x flex gap-2 border-b border-[var(--canon-border-glass)] pb-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 px-3 py-1.5 text-sm font-medium ${
              tab === item.key
                ? "border-b-2 border-[var(--canon-gold)] text-[var(--canon-gold)]"
                : "text-[var(--canon-text-muted)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="canon-scroll-x flex flex-wrap gap-2">
        {["project", "type", "status", "author", "date"].map((key) => (
          <button key={key} type="button" className="canon-ghost-btn shrink-0 !text-xs">
            {t(`docFilter_${key}`)} ▾
          </button>
        ))}
        <button type="button" className="text-xs text-[var(--canon-text-muted)]">{t("resetFilters")}</button>
        <div className="ml-auto flex rounded-lg border border-[var(--canon-border-glass)] p-0.5">
          <button
            type="button"
            className={`canon-notify-btn !w-9 ${viewMode === "list" ? "text-[var(--canon-gold)]" : ""}`}
            onClick={() => setViewMode("list")}
            aria-label={t("viewList")}
          >
            <List size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={`canon-notify-btn !w-9 ${viewMode === "grid" ? "text-[var(--canon-gold)]" : ""}`}
            onClick={() => setViewMode("grid")}
            aria-label={t("viewGrid")}
          >
            <LayoutGrid size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="canon-documents-workspace">
        <aside className="canon-documents-folders canon-glass p-3 min-w-0">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold text-[var(--canon-text-primary)] lg:pointer-events-none"
            onClick={() => setFoldersOpen((v) => !v)}
            aria-expanded={foldersOpen}
          >
            <span>{t("docFolderTree")}</span>
            <ChevronDown
              size={16}
              className={`lg:hidden transition-transform ${foldersOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          <ul className={`mt-3 space-y-1 text-sm ${foldersOpen ? "block" : "hidden lg:block"}`}>
              {folderTree.map((folder) => (
                <li key={folder.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTab(folder.id);
                      setSelectedId(null);
                      setMobilePreviewOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left ${
                      tab === folder.id
                        ? "bg-[rgba(255,193,7,0.1)] text-[var(--canon-gold)]"
                        : "text-[var(--canon-text-secondary)] hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <Folder size={16} className="shrink-0 text-[var(--canon-gold)]" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{folder.label}</span>
                    <span className="tabular-nums text-xs">{folder.count}</span>
                    {folder.id !== "all" ? <ChevronRight size={14} className="opacity-50" aria-hidden /> : null}
                  </button>
                </li>
              ))}
            </ul>
        </aside>

        <section className="canon-glass min-w-0 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<span className="text-2xl">📄</span>}
                title={tDetail("noDocumentsYet")}
                subtitle={tDetail("createDocumentHint")}
                action={
                  <button type="button" className="canon-gold-btn" onClick={() => setCreateOpen(true)}>
                    {t("uploadFiles")}
                  </button>
                }
              />
            </div>
          ) : visibleRows.length === 0 ? (
            <p className="p-6 text-sm text-[var(--canon-text-muted)]">{tDetail("noDocumentsInFolder")}</p>
          ) : viewMode === "list" ? (
            <div className="canon-data-table-wrap">
              <table className="canon-data-table">
                <thead>
                  <tr>
                    <th>{tDetail("title")}</th>
                    <th>{tDetail("type")}</th>
                    <th>{tDetail("status")}</th>
                    <th className="canon-hide-mobile">{tDetail("created")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((doc) => (
                    <tr
                      key={doc.id}
                      className={selectedId === doc.id ? "bg-[rgba(255,193,7,0.06)]" : undefined}
                      onClick={() => selectDocument(doc.id)}
                    >
                      <td>
                        <button
                          type="button"
                          className="font-medium text-[var(--canon-text-primary)] hover:text-[var(--canon-gold)]"
                          onClick={() => selectDocument(doc.id)}
                        >
                          {doc.title}
                        </button>
                      </td>
                      <td>{doc.type}</td>
                      <td>
                        <span className={statusBadgeClass(doc.status)}>
                          {formatPortalStatus(doc.status, "document", tPortal)}
                        </span>
                      </td>
                      <td className="canon-hide-mobile text-xs">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              {visibleRows.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => selectDocument(doc.id)}
                  className={`canon-glass rounded-xl p-3 text-left ${
                    selectedId === doc.id ? "ring-1 ring-[var(--canon-gold)]" : ""
                  }`}
                >
                  <p className="font-medium text-[var(--canon-text-primary)]">{doc.title}</p>
                  <span className={`mt-2 ${statusBadgeClass(doc.status)}`}>
                    {formatPortalStatus(doc.status, "document", tPortal)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-[var(--canon-border-glass)] px-4 py-2 text-xs text-[var(--canon-text-muted)]">
            {t("docPagination", {
              from: 1,
              to: Math.min(10, visibleRows.length),
              total: visibleRows.length,
            })}
          </div>
        </section>

        {selected ? (
          <div className="canon-documents-preview-col">
            <DocumentPreviewPane
              projectId={projectId}
              doc={selected}
              onDocumentUpdated={refreshDocuments}
            />
          </div>
        ) : (
          <div className="canon-documents-preview-col canon-glass flex min-h-[200px] items-center justify-center p-6 text-sm text-[var(--canon-text-muted)]">
            {t("docSelectToPreview")}
          </div>
        )}
      </div>

      {mobilePreviewOpen && selected ? (
        <>
          <button
            type="button"
            className="canon-mobile-preview-backdrop lg:hidden"
            aria-label={tCommon("close")}
            onClick={() => setMobilePreviewOpen(false)}
          />
          <DocumentPreviewPane
            projectId={projectId}
            doc={selected}
            mobile
            onDocumentUpdated={refreshDocuments}
            onClose={() => setMobilePreviewOpen(false)}
          />
        </>
      ) : null}

      <CanonCreateDocumentModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
          createMutation.reset();
        }}
        isSubmitting={createMutation.isPending}
        error={createError}
        onSubmit={async (body, file) => {
          setCreateError(null);
          await createMutation.mutateAsync({ body, file });
        }}
      />
    </div>
  );
}
