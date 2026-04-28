"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import {
  Card,
  SectionHeader,
  Skeleton,
  EmptyState,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Modal,
  Button,
  Textarea,
} from "@/components/ui";
import { getPublicConfig } from "@/lib/config/public";
import {
  statusLabel,
  statusBadgeClass,
} from "@/lib/domain/projects/project-status.service";
import { ProjectAttentionBlock } from "@/components/projects/ProjectAttentionBlock";
import { ProjectTimelineBlock } from "@/components/projects/ProjectTimelineBlock";
import { StakeholderActivityBlock } from "@/components/projects/StakeholderActivityBlock";
import type { ProjectAttentionSummary } from "@/lib/domain/projects/project-attention.types";
import type { TimelineItem } from "@/lib/domain/projects/project-timeline.types";
import { formatStatusLabel, taskStatusBadgeClass } from "../../statusBadgeStyles";
import { reportStatusBadgeClass } from "../../reports/reportStatusStyles";
import { issueStatusBadgeClass } from "./statusBadgeStyles";

interface Project {
  id: string;
  name: string;
  tenant_id: string;
  created_at?: string;
}

interface AttentionItem {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  count?: number;
}

interface Summary {
  activeWorkers: number;
  openReports: number;
  aiAnalyses: number;
  tasksTotal?: number;
  tasksInProgress?: number;
  tasksDone?: number;
  milestonesCount?: number;
  openIssuesCount?: number;
  pendingDecisionsCount?: number;
  projectStatus?: "draft" | "active" | "at_risk" | "blocked" | "completed";
  healthLevel?: "good" | "warning" | "critical";
  statusReasons?: Array<{ code: string; label: string; hint?: string }>;
  attentionItems?: AttentionItem[];
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status: string;
  sort_order: number;
}

interface Issue {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  created_at: string;
}

interface Document {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  object_path?: string | null;
  created_at: string;
}

interface Report {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
}

interface Media {
  id: string;
  file_url: string;
  uploaded_at?: string;
}

const EMPTY_MILESTONES: Milestone[] = [];
const EMPTY_ISSUES: Issue[] = [];
const EMPTY_DOCUMENTS: Document[] = [];
const EMPTY_REPORTS: Report[] = [];
const EMPTY_MEDIA: Media[] = [];

type BulkDecisionAction = "approve" | "reject" | "request_changes";
const MAX_BULK_DECISION_ITEMS = 20;

async function fetchProject(projectId: string): Promise<Project> {
  const res = await fetch(`/api/v1/projects/${projectId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Not found");
  const json = await res.json();
  return json.data;
}

async function fetchSummary(projectId: string): Promise<Summary> {
  const res = await fetch(`/api/v1/projects/${projectId}/summary`, { credentials: "include" });
  if (!res.ok) return { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };
  const json = await res.json();
  return json.data ?? { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };
}

async function fetchAttention(projectId: string): Promise<ProjectAttentionSummary> {
  const res = await fetch(`/api/v1/projects/${projectId}/attention?viewer=owner`, { credentials: "include" });
  if (!res.ok) return { items: [], sections: [], totalCount: 0, criticalCount: 0, warningCount: 0 };
  const json = await res.json();
  return json.data ?? { items: [], sections: [], totalCount: 0, criticalCount: 0, warningCount: 0 };
}

async function fetchTimeline(projectId: string): Promise<TimelineItem[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/timeline?limit=10`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchStakeholderActivity(projectId: string) {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-activity?limit=20`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchIssues(projectId: string): Promise<Issue[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/issues`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).filter((i: Issue) => ["open", "in_review"].includes(i.status));
}

async function fetchDocuments(projectId: string): Promise<Document[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).filter((d: Document) => d.status === "under_review");
}

async function submitDecision(
  projectId: string,
  documentId: string,
  action: "approve" | "reject" | "request_changes",
  comment?: string
): Promise<{ data: Document }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/documents/${documentId}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, comment: comment || undefined }),
    }
  );
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "decision_failed");
  }
  const json = await res.json();
  return json;
}

function documentFileUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  const base = (getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${objectPath}`;
}

async function fetchReports(projectId: string): Promise<{ data: Report[]; total: number }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/reports?limit=10&offset=0`,
    { credentials: "include" }
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

async function fetchMedia(projectId: string): Promise<Media[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/media?limit=12`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function OwnerViewClient({ projectId }: { projectId: string }) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [decisionDoc, setDecisionDoc] = useState<Document | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSearch, setDecisionSearch] = useState("");
  const [decisionTypeFilter, setDecisionTypeFilter] = useState("all");
  const [decisionSort, setDecisionSort] = useState<"oldest" | "newest">("oldest");
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<string[]>([]);
  const [bulkDecisionError, setBulkDecisionError] = useState<string | null>(null);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkDecisionAction | null>(null);

  const decisionMutation = useMutation({
    mutationFn: ({
      documentId,
      action,
      comment,
    }: {
      documentId: string;
      action: "approve" | "reject" | "request_changes";
      comment?: string;
    }) => submitDecision(projectId, documentId, action, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-attention", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-timeline", projectId] });
      setDecisionDoc(null);
      setDecisionComment("");
      setDecisionError(null);
    },
    onError: (err) => {
      if (err instanceof Error && err.message !== "decision_failed") {
        setDecisionError(err.message);
        return;
      }
      setDecisionError(tDetail("decisionFailed"));
    },
  });

  const bulkDecisionMutation = useMutation({
    mutationFn: async (input: { documentIds: string[]; action: BulkDecisionAction }) => {
      for (const documentId of input.documentIds) {
        await submitDecision(projectId, documentId, input.action);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-attention", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-timeline", projectId] });
      setSelectedDecisionIds([]);
      setBulkDecisionError(null);
      setPendingBulkAction(null);
      if (decisionDoc && selectedDecisionIds.includes(decisionDoc.id)) {
        setDecisionDoc(null);
        setDecisionComment("");
        setDecisionError(null);
      }
    },
    onError: (err) => {
      if (err instanceof Error && err.message !== "decision_failed") {
        setBulkDecisionError(err.message);
        return;
      }
      setBulkDecisionError(tDetail("bulkDecisionFailed"));
    },
  });

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });
  const summaryQuery = useQuery({
    queryKey: ["project-summary", projectId],
    queryFn: () => fetchSummary(projectId),
    enabled: !!projectId,
  });
  const milestonesQuery = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchMilestones(projectId),
    enabled: !!projectId,
  });
  const issuesQuery = useQuery({
    queryKey: ["project-issues-owner", projectId],
    queryFn: () => fetchIssues(projectId),
    enabled: !!projectId,
  });
  const documentsQuery = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: () => fetchDocuments(projectId),
    enabled: !!projectId,
  });
  const attentionQuery = useQuery({
    queryKey: ["project-attention", projectId, "owner"],
    queryFn: () => fetchAttention(projectId),
    enabled: !!projectId,
  });
  const timelineQuery = useQuery({
    queryKey: ["project-timeline", projectId],
    queryFn: () => fetchTimeline(projectId),
    enabled: !!projectId,
  });
  const stakeholderActivityQuery = useQuery({
    queryKey: ["stakeholder-activity", projectId, "owner"],
    queryFn: () => fetchStakeholderActivity(projectId),
    enabled: !!projectId,
  });
  const reportsQuery = useQuery({
    queryKey: ["project-reports-owner", projectId],
    queryFn: () => fetchReports(projectId),
    enabled: !!projectId,
  });
  const mediaQuery = useQuery({
    queryKey: ["project-media", projectId],
    queryFn: () => fetchMedia(projectId),
    enabled: !!projectId,
  });

  const project = projectQuery.data;
  const summary = summaryQuery.data ?? { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };
  const attention = attentionQuery.data ?? { items: [], sections: [], totalCount: 0, criticalCount: 0, warningCount: 0 };
  const timeline = timelineQuery.data ?? [];
  const loading = projectQuery.isPending && !project;
  const error = projectQuery.isError || projectQuery.error;
  const projectStatus = summary.projectStatus ?? "active";

  const milestones = milestonesQuery.data ?? EMPTY_MILESTONES;
  const issues = issuesQuery.data ?? EMPTY_ISSUES;
  const pendingDecisions = documentsQuery.data ?? EMPTY_DOCUMENTS;
  const reports = reportsQuery.data?.data ?? EMPTY_REPORTS;
  const media = mediaQuery.data ?? EMPTY_MEDIA;

  const decisionTypes = useMemo(
    () => Array.from(new Set(pendingDecisions.map((d) => d.type).filter(Boolean))).sort(),
    [pendingDecisions]
  );
  const topDecisionTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of pendingDecisions) {
      counts.set(d.type, (counts.get(d.type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }, [pendingDecisions]);

  const oldestPendingDecision = useMemo(
    () =>
      [...pendingDecisions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0] ?? null,
    [pendingDecisions]
  );

  const filteredPendingDecisions = useMemo(() => {
    const base = [...pendingDecisions].sort((a, b) => {
      const left = new Date(a.created_at).getTime();
      const right = new Date(b.created_at).getTime();
      return decisionSort === "oldest" ? left - right : right - left;
    });

    const normalizedQuery = decisionSearch.trim().toLowerCase();
    return base.filter((d) => {
      if (decisionTypeFilter !== "all" && d.type !== decisionTypeFilter) return false;
      if (!normalizedQuery) return true;
      return (
        d.title.toLowerCase().includes(normalizedQuery) ||
        d.type.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [pendingDecisions, decisionSort, decisionTypeFilter, decisionSearch]);

  const filteredDecisionIds = useMemo(
    () => filteredPendingDecisions.map((d) => d.id),
    [filteredPendingDecisions]
  );

  const selectedFilteredCount = useMemo(
    () => selectedDecisionIds.filter((id) => filteredDecisionIds.includes(id)).length,
    [selectedDecisionIds, filteredDecisionIds]
  );
  const allVisibleSelected =
    filteredDecisionIds.length > 0 && selectedFilteredCount === filteredDecisionIds.length;

  const selectedDecisionDocs = useMemo(() => {
    const selectedSet = new Set(selectedDecisionIds);
    return pendingDecisions.filter((d) => selectedSet.has(d.id));
  }, [pendingDecisions, selectedDecisionIds]);

  const selectedDecisionTypeCounts = useMemo(() => {
    const acc = new Map<string, number>();
    for (const d of selectedDecisionDocs) {
      acc.set(d.type, (acc.get(d.type) ?? 0) + 1);
    }
    return Array.from(acc.entries())
      .sort(([aType], [bType]) => aType.localeCompare(bType))
      .map(([type, count]) => ({ type, count }));
  }, [selectedDecisionDocs]);

  const hiddenSelectedCount = Math.max(0, selectedDecisionIds.length - selectedFilteredCount);
  const bulkSelectionOverLimit = selectedDecisionIds.length > MAX_BULK_DECISION_ITEMS;

  useEffect(() => {
    const alive = new Set(pendingDecisions.map((d) => d.id));
    setSelectedDecisionIds((prev) => prev.filter((id) => alive.has(id)));
  }, [pendingDecisions]);

  if (loading && !project) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={tDetail("projectNotFound")}
          subtitle={
            projectQuery.error instanceof Error
              ? projectQuery.error.message
              : tDetail("youMayNotHaveAccess")
          }
          action={
            <Link href="/dashboard/projects" className="text-aistroyka-accent hover:underline">
              {tDetail("backToProjects")}
            </Link>
          }
        />
      </Card>
    );
  }

  function openDecision(document: Document): void {
    setDecisionDoc(document);
    setDecisionComment("");
    setDecisionError(null);
  }

  function toggleDecisionSelection(documentId: string): void {
    setSelectedDecisionIds((prev) =>
      prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId]
    );
  }

  function selectAllFilteredDecisions(): void {
    setSelectedDecisionIds((prev) => {
      const merged = new Set([...prev, ...filteredDecisionIds]);
      return Array.from(merged);
    });
  }

  function clearDecisionSelection(): void {
    setSelectedDecisionIds([]);
  }

  function toggleSelectVisibleDecisions(): void {
    setSelectedDecisionIds((prev) => {
      const visibleSet = new Set(filteredDecisionIds);
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleSet.has(id));
      }
      const merged = new Set([...prev, ...filteredDecisionIds]);
      return Array.from(merged);
    });
  }

  function selectUpToLimitFromVisible(): void {
    const visibleTop = filteredPendingDecisions
      .slice(0, MAX_BULK_DECISION_ITEMS)
      .map((d) => d.id);
    setSelectedDecisionIds(visibleTop);
  }

  function selectOldestUpToLimitFromVisible(): void {
    const oldestVisible = [...filteredPendingDecisions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, MAX_BULK_DECISION_ITEMS)
      .map((d) => d.id);
    setSelectedDecisionIds(oldestVisible);
  }

  function trimSelectionToLimit(): void {
    const ordered = [...selectedDecisionDocs]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, MAX_BULK_DECISION_ITEMS)
      .map((d) => d.id);
    setSelectedDecisionIds(ordered);
  }

  function clearDecisionFilters(): void {
    setDecisionSearch("");
    setDecisionTypeFilter("all");
    setDecisionSort("oldest");
  }

  function applyQuickDecisionPreset(preset: "all" | "oldest" | "newest" | "type", type?: string): void {
    setDecisionSearch("");
    if (preset === "all") {
      setDecisionTypeFilter("all");
      setDecisionSort("oldest");
      return;
    }
    if (preset === "oldest") {
      setDecisionTypeFilter("all");
      setDecisionSort("oldest");
      return;
    }
    if (preset === "newest") {
      setDecisionTypeFilter("all");
      setDecisionSort("newest");
      return;
    }
    if (preset === "type" && type) {
      setDecisionTypeFilter(type);
      setDecisionSort("oldest");
    }
  }

  function runBulkDecision(action: BulkDecisionAction): void {
    if (selectedDecisionIds.length === 0 || bulkDecisionMutation.isPending) return;
    if (bulkSelectionOverLimit) {
      setBulkDecisionError(
        tDetail("bulkSelectionLimitExceeded", { max: MAX_BULK_DECISION_ITEMS })
      );
      return;
    }
    setPendingBulkAction(action);
  }

  function executeBulkDecision(): void {
    if (!pendingBulkAction || selectedDecisionIds.length === 0 || bulkDecisionMutation.isPending) return;
    if (selectedDecisionDocs.length !== selectedDecisionIds.length) {
      setBulkDecisionError(tDetail("bulkSelectionOutOfSync"));
      return;
    }
    setBulkDecisionError(null);
    bulkDecisionMutation.mutate({
      documentIds: selectedDecisionDocs.map((d) => d.id),
      action: pendingBulkAction,
    });
  }

  const pendingBulkActionLabel =
    pendingBulkAction === "approve"
      ? tDetail("bulkApprove")
      : pendingBulkAction === "reject"
        ? tDetail("bulkReject")
        : pendingBulkAction === "request_changes"
          ? tDetail("bulkRequestChanges")
          : "";

  function closeBulkConfirm(): void {
    if (bulkDecisionMutation.isPending) return;
    setPendingBulkAction(null);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          {tDetail("backToProject")}
        </Link>
        <span className="text-aistroyka-text-tertiary">|</span>
        <Link href="/dashboard/projects" className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
          {tDetail("allProjects")}
        </Link>
      </div>
      <SectionHeader title={project.name} subtitle={tPage("ownerViewSubtitle")} />

      {/* Status + one-line explanation */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Badge className={statusBadgeClass(projectStatus)}>{statusLabel(projectStatus)}</Badge>
        {summary.statusReasons?.[0]?.hint && (
          <span className="text-aistroyka-text-secondary">{summary.statusReasons[0].hint}</span>
        )}
      </div>

      {/* Your attention — what needs you */}
      <div className="mb-6">
        <ProjectAttentionBlock
          summary={attention}
          title={tDetail("yourAttention")}
          emptyMessage={tDetail("nothingRequiringYourAction")}
        />
      </div>

      {/* Pending decisions — primary action surface */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">{tDetail("approveDocuments")}</h2>
        {documentsQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : pendingDecisions.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title={tDetail("noDocumentsAwaitingApproval")}
            subtitle={tDetail("documentsUnderReviewAppear")}
          />
        ) : (
          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => oldestPendingDecision && openDecision(oldestPendingDecision)}
                disabled={!oldestPendingDecision}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tDetail("reviewOldest")}
              </button>
              <span className="text-xs text-aistroyka-text-tertiary">
                {tDetail("decisionQueueSummary", { count: pendingDecisions.length })}
              </span>
            </div>
            <p className="mb-3 text-xs text-aistroyka-text-tertiary">
              {tDetail("decisionQueueStatsLine", {
                total: pendingDecisions.length,
                visible: filteredPendingDecisions.length,
                selected: selectedDecisionIds.length,
                hidden: hiddenSelectedCount,
              })}
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAllFilteredDecisions}
                disabled={filteredPendingDecisions.length === 0 || bulkDecisionMutation.isPending}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tDetail("selectAllFiltered")}
              </button>
              <button
                type="button"
                onClick={toggleSelectVisibleDecisions}
                disabled={filteredPendingDecisions.length === 0 || bulkDecisionMutation.isPending}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {allVisibleSelected ? tDetail("deselectVisible") : tDetail("selectVisible")}
              </button>
              <button
                type="button"
                onClick={selectUpToLimitFromVisible}
                disabled={filteredPendingDecisions.length === 0 || bulkDecisionMutation.isPending}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tDetail("selectUpToLimit", { max: MAX_BULK_DECISION_ITEMS })}
              </button>
              <button
                type="button"
                onClick={selectOldestUpToLimitFromVisible}
                disabled={filteredPendingDecisions.length === 0 || bulkDecisionMutation.isPending}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tDetail("selectOldestUpToLimit", { max: MAX_BULK_DECISION_ITEMS })}
              </button>
              <button
                type="button"
                onClick={clearDecisionSelection}
                disabled={selectedDecisionIds.length === 0 || bulkDecisionMutation.isPending}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tDetail("clearSelection")}
              </button>
              <button
                type="button"
                onClick={() => runBulkDecision("approve")}
                disabled={selectedDecisionIds.length === 0 || bulkDecisionMutation.isPending || bulkSelectionOverLimit}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkDecisionMutation.isPending ? tDetail("bulkProcessing") : tDetail("bulkApprove")}
              </button>
              <button
                type="button"
                onClick={() => runBulkDecision("reject")}
                disabled={selectedDecisionIds.length === 0 || bulkDecisionMutation.isPending || bulkSelectionOverLimit}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkDecisionMutation.isPending ? tDetail("bulkProcessing") : tDetail("bulkReject")}
              </button>
              <button
                type="button"
                onClick={() => runBulkDecision("request_changes")}
                disabled={selectedDecisionIds.length === 0 || bulkDecisionMutation.isPending || bulkSelectionOverLimit}
                className="rounded border border-aistroyka-border-subtle px-3 py-1.5 text-xs font-medium text-aistroyka-text-primary transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkDecisionMutation.isPending ? tDetail("bulkProcessing") : tDetail("bulkRequestChanges")}
              </button>
              <span className="text-xs text-aistroyka-text-tertiary">
                {tDetail("selectedItemsCount", { count: selectedDecisionIds.length })}
              </span>
            </div>
            {hiddenSelectedCount > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-xs text-aistroyka-text-tertiary">
                  {tDetail("hiddenSelectedItemsHint", { count: hiddenSelectedCount })}
                </p>
                <button
                  type="button"
                  onClick={clearDecisionFilters}
                  className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs text-aistroyka-text-secondary transition-colors hover:border-aistroyka-accent hover:text-aistroyka-text-primary"
                >
                  {tDetail("clearDecisionFilters")}
                </button>
              </div>
            )}
            {bulkSelectionOverLimit && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-xs text-aistroyka-warning">
                  {tDetail("bulkSelectionLimitExceeded", { max: MAX_BULK_DECISION_ITEMS })}
                </p>
                <button
                  type="button"
                  onClick={trimSelectionToLimit}
                  className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs text-aistroyka-text-secondary transition-colors hover:border-aistroyka-accent hover:text-aistroyka-text-primary"
                >
                  {tDetail("trimSelectionToLimit", { max: MAX_BULK_DECISION_ITEMS })}
                </button>
              </div>
            )}
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <input
                value={decisionSearch}
                onChange={(e) => setDecisionSearch(e.target.value)}
                placeholder={tDetail("decisionQueueSearchPlaceholder")}
                className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary outline-none focus:border-aistroyka-accent"
              />
              <select
                value={decisionTypeFilter}
                onChange={(e) => setDecisionTypeFilter(e.target.value)}
                className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary outline-none focus:border-aistroyka-accent"
              >
                <option value="all">{tDetail("decisionQueueTypeAll")}</option>
                {decisionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={decisionSort}
                onChange={(e) => setDecisionSort(e.target.value as "oldest" | "newest")}
                className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary outline-none focus:border-aistroyka-accent"
              >
                <option value="oldest">{tDetail("decisionQueueSortOldest")}</option>
                <option value="newest">{tDetail("decisionQueueSortNewest")}</option>
              </select>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-aistroyka-text-tertiary">{tDetail("decisionQuickPresetsLabel")}</span>
              <button
                type="button"
                onClick={() => applyQuickDecisionPreset("all")}
                className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs text-aistroyka-text-secondary transition-colors hover:border-aistroyka-accent hover:text-aistroyka-text-primary"
              >
                {tDetail("decisionPresetAll")}
              </button>
              <button
                type="button"
                onClick={() => applyQuickDecisionPreset("oldest")}
                className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs text-aistroyka-text-secondary transition-colors hover:border-aistroyka-accent hover:text-aistroyka-text-primary"
              >
                {tDetail("decisionPresetOldest")}
              </button>
              <button
                type="button"
                onClick={() => applyQuickDecisionPreset("newest")}
                className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs text-aistroyka-text-secondary transition-colors hover:border-aistroyka-accent hover:text-aistroyka-text-primary"
              >
                {tDetail("decisionPresetNewest")}
              </button>
              {topDecisionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => applyQuickDecisionPreset("type", type)}
                  className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs text-aistroyka-text-secondary transition-colors hover:border-aistroyka-accent hover:text-aistroyka-text-primary"
                >
                  {tDetail("decisionPresetType", { type })}
                </button>
              ))}
            </div>
            {bulkDecisionError && (
              <p className="mb-3 text-sm text-aistroyka-error">{bulkDecisionError}</p>
            )}
            <ul className="space-y-2">
              {filteredPendingDecisions.map((d) => (
                <li key={d.id}>
                  <div className="w-full flex items-start gap-2 rounded border border-aistroyka-border-subtle p-3 hover:border-aistroyka-accent transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedDecisionIds.includes(d.id)}
                      onChange={() => toggleDecisionSelection(d.id)}
                      disabled={bulkDecisionMutation.isPending}
                      className="mt-1 h-4 w-4 rounded border-aistroyka-border-subtle accent-aistroyka-accent"
                      aria-label={tDetail("selectDecision")}
                    />
                    <button
                      type="button"
                      onClick={() => openDecision(d)}
                      className="flex-1 flex items-center justify-between text-left hover:text-aistroyka-accent"
                    >
                      <span>
                        <span className="font-medium">{d.title}</span>
                        <span className="mt-1 block text-xs text-aistroyka-text-tertiary">
                          {new Date(d.created_at).toLocaleDateString()}
                        </span>
                      </span>
                      <Badge variant="warning">{d.type}</Badge>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {filteredPendingDecisions.length === 0 && (
              <p className="mt-3 text-sm text-aistroyka-text-secondary">{tDetail("decisionQueueFilteredEmpty")}</p>
            )}
          </div>
        )}
      </Card>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6" aria-label={tDetail("projectSummary")}>
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("tasks")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {summary.tasksDone ?? 0} / {summary.tasksTotal ?? 0}
          </p>
          <p className="text-xs text-aistroyka-text-tertiary">({summary.tasksInProgress ?? 0} {tDetail("inProgress")})</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("milestones")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.milestonesCount ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("openIssues")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.openIssuesCount ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("pendingDecisions")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.pendingDecisionsCount ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("openReports")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.openReports}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("photos")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{media.length}</p>
        </Card>
      </section>

      {/* Recent activity — portal vs operations */}
      <div className="mb-6 space-y-6">
        <StakeholderActivityBlock
          items={stakeholderActivityQuery.data ?? []}
          title={tDetail("clientPortalActivity")}
          emptyMessage={tDetail("noClientPortalActivityYet")}
          maxItems={10}
        />
        <ProjectTimelineBlock
          items={timeline}
          title={tDetail("projectOperations")}
          emptyMessage={tDetail("noActivityYet")}
          maxItems={10}
        />
      </div>

      {/* Milestones */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">{tDetail("milestones")}</h2>
        {milestonesQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : milestones.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📅</span>}
            title={tDetail("noMilestones")}
            subtitle={tDetail("milestonesAppearWhenAdded")}
          />
        ) : (
          <div className="p-4">
            <ul className="space-y-3">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-aistroyka-border-subtle p-3">
                  <div>
                    <p className="font-medium text-aistroyka-text-primary">{m.title}</p>
                    <p className="text-xs text-aistroyka-text-tertiary">
                      {tDetail("target")}: {new Date(m.target_date).toLocaleDateString()} · {m.status}
                    </p>
                  </div>
                  <Badge className={taskStatusBadgeClass(m.status)}>
                    {formatStatusLabel(m.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Issues */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">{tDetail("openIssues")}</h2>
        {issuesQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : issues.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">✅</span>}
            title={tDetail("noOpenIssues")}
            subtitle={tDetail("allIssuesResolvedOrClosed")}
          />
        ) : (
          <div className="p-4">
            <Table aria-label={tDetail("openIssues")}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
                  <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
                  <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.title}</TableCell>
                    <TableCell>
                      <Badge className={issueStatusBadgeClass(i.status)}>{formatStatusLabel(i.status)}</Badge>
                    </TableCell>
                    <TableCell>{new Date(i.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Decision modal */}
      {decisionDoc && (
        <Modal
          open={!!decisionDoc}
          onClose={() => {
            if (!decisionMutation.isPending) {
              setDecisionDoc(null);
              setDecisionComment("");
              setDecisionError(null);
            }
          }}
          title={tDetail("decisionModalTitle", { title: decisionDoc.title })}
        >
          <div className="space-y-4">
            <p className="text-sm text-aistroyka-text-secondary">
              {tDetail("decisionMetaLine", {
                type: decisionDoc.type,
                date: new Date(decisionDoc.created_at).toLocaleDateString(),
              })}
            </p>
            {decisionDoc.description && (
              <p className="text-sm text-aistroyka-text-primary">{decisionDoc.description}</p>
            )}
            {decisionDoc.object_path && documentFileUrl(decisionDoc.object_path) && (
              <a
                href={documentFileUrl(decisionDoc.object_path)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-aistroyka-accent hover:underline text-sm block"
              >
                {tDetail("openFileArrow")}
              </a>
            )}
            <label className="block">
              <span className="text-aistroyka-caption text-aistroyka-text-secondary">{tDetail("commentOptional")}</span>
              <Textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder={tDetail("addShortCommentOrReason")}
                rows={3}
                className="mt-1 w-full"
              />
            </label>
            {decisionError && (
              <p className="text-sm text-aistroyka-error">{decisionError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() =>
                  decisionMutation.mutate({
                    documentId: decisionDoc.id,
                    action: "approve",
                    comment: decisionComment || undefined,
                  })
                }
                disabled={decisionMutation.isPending}
              >
                {tDetail("approve")}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  decisionMutation.mutate({
                    documentId: decisionDoc.id,
                    action: "reject",
                    comment: decisionComment || undefined,
                  })
                }
                disabled={decisionMutation.isPending}
              >
                {tDetail("reject")}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  decisionMutation.mutate({
                    documentId: decisionDoc.id,
                    action: "request_changes",
                    comment: decisionComment || undefined,
                  })
                }
                disabled={decisionMutation.isPending}
              >
                {tDetail("requestChanges")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDecisionDoc(null);
                  setDecisionComment("");
                  setDecisionError(null);
                }}
                disabled={decisionMutation.isPending}
              >
                {tDetail("cancel")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {pendingBulkAction && (
        <Modal
          open={!!pendingBulkAction}
          onClose={closeBulkConfirm}
          title={tDetail("bulkConfirmTitle")}
        >
          <div className="space-y-4">
            <p className="text-sm text-aistroyka-text-secondary">
              {tDetail("bulkConfirmMessage", {
                action: pendingBulkActionLabel,
                count: selectedDecisionIds.length,
              })}
            </p>
            {selectedDecisionDocs.length > 0 && (
              <div className="rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
                  {tDetail("bulkConfirmSelectedListTitle")}
                </p>
                {selectedDecisionTypeCounts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-aistroyka-text-tertiary">
                      {tDetail("bulkConfirmTypeBreakdownTitle")}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {selectedDecisionTypeCounts.slice(0, 8).map((row) => (
                        <li key={row.type} className="text-xs text-aistroyka-text-tertiary">
                          {tDetail("bulkConfirmTypeCountLine", { type: row.type, count: row.count })}
                        </li>
                      ))}
                    </ul>
                    {selectedDecisionTypeCounts.length > 8 && (
                      <p className="mt-1 text-xs text-aistroyka-text-tertiary">
                        {tDetail("bulkConfirmTypeBreakdownTruncated", { count: selectedDecisionTypeCounts.length - 8 })}
                      </p>
                    )}
                  </div>
                )}
                <ul className="space-y-1">
                  {selectedDecisionDocs.slice(0, 6).map((d) => (
                    <li key={d.id}>
                      <p className="text-sm text-aistroyka-text-secondary">{d.title}</p>
                      <p className="text-xs text-aistroyka-text-tertiary">
                        {tDetail("bulkConfirmSelectedItemMeta", {
                          type: d.type,
                          date: new Date(d.created_at).toLocaleDateString(),
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
                {selectedDecisionDocs.length > 6 && (
                  <p className="mt-2 text-xs text-aistroyka-text-tertiary">
                    {tDetail("selectedItemsCount", { count: selectedDecisionDocs.length })}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={executeBulkDecision}
                disabled={bulkDecisionMutation.isPending}
              >
                {bulkDecisionMutation.isPending ? tDetail("bulkProcessing") : tDetail("bulkConfirmProceed")}
              </Button>
              <Button
                variant="ghost"
                onClick={closeBulkConfirm}
                disabled={bulkDecisionMutation.isPending}
              >
                {tDetail("cancel")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Recent reports */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">{tDetail("recentReports")}</h2>
        {reportsQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title={tDetail("noReports")}
            subtitle={tDetail("reportsAppearWhenSubmitted")}
          />
        ) : (
          <div className="p-4">
            <Table aria-label={tDetail("recentReports")}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{tDetail("report")}</TableHeaderCell>
                  <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
                  <TableHeaderCell>{tDetail("date")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/dashboard/daily-reports/${r.id}`} className="text-aistroyka-accent hover:underline font-mono text-sm">
                        {r.id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={reportStatusBadgeClass(r.status)}>{formatStatusLabel(r.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleDateString()
                        : new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Recent photos */}
      <Card>
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">{tDetail("recentPhotos")}</h2>
        {mediaQuery.isPending ? (
          <Skeleton className="m-4 h-32" />
        ) : media.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📷</span>}
            title={tDetail("noPhotos")}
            subtitle={tDetail("photosFromReportsAppear")}
          />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((m) => (
                <a
                  key={m.id}
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square rounded-lg overflow-hidden border border-aistroyka-border-subtle hover:border-aistroyka-accent transition-colors"
                >
                  <img
                    src={m.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
