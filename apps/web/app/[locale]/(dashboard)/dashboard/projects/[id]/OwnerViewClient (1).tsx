"use client";

import { useState } from "react";
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
import type { ProjectStatus } from "@/lib/domain/projects/project-status.types";
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
    throw new Error((j as { error?: string }).error ?? "Decision failed");
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
  const queryClient = useQueryClient();
  const [decisionDoc, setDecisionDoc] = useState<Document | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);

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
      setDecisionError(err instanceof Error ? err.message : "Decision failed");
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
          title="Project not found"
          subtitle={
            projectQuery.error instanceof Error
              ? projectQuery.error.message
              : "You may not have access to this project."
          }
          action={
            <Link href="/dashboard/projects" className="text-aistroyka-accent hover:underline">
              ← Back to projects
            </Link>
          }
        />
      </Card>
    );
  }

  const milestones = milestonesQuery.data ?? [];
  const issues = issuesQuery.data ?? [];
  const pendingDecisions = documentsQuery.data ?? [];
  const reports = reportsQuery.data?.data ?? [];
  const media = mediaQuery.data ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          ← Project detail
        </Link>
        <span className="text-aistroyka-text-tertiary">|</span>
        <Link href="/dashboard/projects" className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
          All projects
        </Link>
      </div>
      <SectionHeader title={project.name} subtitle="Owner view" />

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
          title="Your attention"
          emptyMessage="Nothing requiring your action."
        />
      </div>

      {/* Pending decisions — primary action surface */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">Approve documents</h2>
        {documentsQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : pendingDecisions.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title="No documents awaiting approval"
            subtitle="Documents under review will appear here."
          />
        ) : (
          <div className="p-4">
            <ul className="space-y-2">
              {pendingDecisions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionDoc(d);
                      setDecisionComment("");
                      setDecisionError(null);
                    }}
                    className="w-full flex items-center justify-between rounded border border-aistroyka-border-subtle p-3 text-left hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised transition-colors"
                  >
                    <span className="font-medium">{d.title}</span>
                    <Badge variant="warning">{d.type}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6" aria-label="Project summary">
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Tasks</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {summary.tasksDone ?? 0} / {summary.tasksTotal ?? 0}
          </p>
          <p className="text-xs text-aistroyka-text-tertiary">({summary.tasksInProgress ?? 0} in progress)</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Milestones</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.milestonesCount ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Open issues</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.openIssuesCount ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Pending decisions</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.pendingDecisionsCount ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Open reports</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.openReports}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Photos</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{media.length}</p>
        </Card>
      </section>

      {/* Recent activity — portal vs operations */}
      <div className="mb-6 space-y-6">
        <StakeholderActivityBlock
          items={stakeholderActivityQuery.data ?? []}
          title="Client & portal activity"
          emptyMessage="No client or portal activity yet."
          maxItems={10}
        />
        <ProjectTimelineBlock
          items={timeline}
          title="Project operations"
          emptyMessage="No activity yet."
          maxItems={10}
        />
      </div>

      {/* Milestones */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">Milestones</h2>
        {milestonesQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : milestones.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📅</span>}
            title="No milestones"
            subtitle="Milestones will appear here when added to the project."
          />
        ) : (
          <div className="p-4">
            <ul className="space-y-3">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-aistroyka-border-subtle p-3">
                  <div>
                    <p className="font-medium text-aistroyka-text-primary">{m.title}</p>
                    <p className="text-xs text-aistroyka-text-tertiary">
                      Target: {new Date(m.target_date).toLocaleDateString()} · {m.status}
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
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">Open issues</h2>
        {issuesQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : issues.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">✅</span>}
            title="No open issues"
            subtitle="All issues are resolved or closed."
          />
        ) : (
          <div className="p-4">
            <Table aria-label="Open issues">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
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
          title={`Decision: ${decisionDoc.title}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-aistroyka-text-secondary">
              Type: {decisionDoc.type} · Created {new Date(decisionDoc.created_at).toLocaleDateString()}
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
                Open file →
              </a>
            )}
            <label className="block">
              <span className="text-aistroyka-caption text-aistroyka-text-secondary">Comment (optional)</span>
              <Textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Add a short comment or reason..."
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
                Approve
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
                Reject
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
                Request changes
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
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Recent reports */}
      <Card className="mb-6">
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">Recent reports</h2>
        {reportsQuery.isPending ? (
          <Skeleton className="m-4 h-24" />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title="No reports"
            subtitle="Reports will appear here when submitted."
          />
        ) : (
          <div className="p-4">
            <Table aria-label="Recent reports">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Report</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
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
        <h2 className="text-aistroyka-subheadline font-semibold p-4 pb-0">Recent photos</h2>
        {mediaQuery.isPending ? (
          <Skeleton className="m-4 h-32" />
        ) : media.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📷</span>}
            title="No photos"
            subtitle="Photos from reports will appear here."
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
