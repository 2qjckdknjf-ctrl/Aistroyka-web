/**
 * Project attention — read model
 *
 * Fetches actionable items: pending decisions, changes requested, open issues.
 * Live-derived, no scheduler.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttentionItem,
  AttentionSection,
  AttentionItemType,
  AttentionSeverity,
  ProjectAttentionSummary,
  AttentionViewerRole,
} from "./project-attention.types";

/** Priority order for item types (1 = highest). */
const TYPE_PRIORITY: Record<AttentionItemType, number> = {
  pending_decision: 1,
  changes_requested: 2,
  open_issue: 3,
};

/** Section labels. */
const SECTION_LABELS: Record<AttentionItemType, string> = {
  pending_decision: "Documents awaiting your decision",
  changes_requested: "Documents awaiting resubmission",
  open_issue: "Open issues",
};

/** Severity for pending_decision: critical if >= 2. */
function severityForPendingDecision(count: number): AttentionSeverity {
  return count >= 2 ? "critical" : "warning";
}

/** Severity for changes_requested: warning. */
function severityForChangesRequested(): AttentionSeverity {
  return "warning";
}

/** Severity for open_issue: critical if >= 3, else warning. */
function severityForIssue(count: number, index: number): AttentionSeverity {
  if (count >= 3) return "critical";
  return "warning";
}

export async function getProjectAttentionSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  viewerRole: AttentionViewerRole
): Promise<ProjectAttentionSummary> {
  const [documentsRes, issuesRes] = await Promise.all([
    supabase
      .from("project_documents")
      .select("id, title, status, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["under_review", "changes_requested"]),
    supabase
      .from("project_issues")
      .select("id, title, status, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["open", "in_review"]),
  ]);

  const documents = (documentsRes.data ?? []) as {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];
  const issues = (issuesRes.data ?? []) as {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];

  const basePath = `/dashboard/projects/${projectId}`;
  const items: AttentionItem[] = [];
  const sections: AttentionSection[] = [];

  // Owner sees: pending_decision, changes_requested (both document-related)
  // Manager sees: all three
  const includePendingDecision =
    viewerRole === "owner" || viewerRole === "manager";
  const includeChangesRequested =
    viewerRole === "owner" || viewerRole === "manager";
  const includeOpenIssues = viewerRole === "manager";

  // 1. Pending decisions (under_review)
  const pendingDocs = documents.filter((d) => d.status === "under_review");
  if (includePendingDecision && pendingDocs.length > 0) {
    const sev = severityForPendingDecision(pendingDocs.length);
    for (const d of pendingDocs) {
      items.push({
        id: `pending_decision:${d.id}`,
        type: "pending_decision",
        severity: sev,
        title: d.title,
        reason: "Awaiting approval or rejection",
        route: viewerRole === "owner" ? `${basePath}/owner` : `${basePath}?tab=documents`,
        entityType: "document",
        entityId: d.id,
        createdAt: d.created_at,
      });
    }
    sections.push({
      type: "pending_decision",
      label: SECTION_LABELS.pending_decision,
      severity: sev,
      items: items.filter((i) => i.type === "pending_decision"),
    });
  }

  // 2. Changes requested
  const changesRequestedDocs = documents.filter(
    (d) => d.status === "changes_requested"
  );
  if (includeChangesRequested && changesRequestedDocs.length > 0) {
    const sev = severityForChangesRequested();
    for (const d of changesRequestedDocs) {
      items.push({
        id: `changes_requested:${d.id}`,
        type: "changes_requested",
        severity: sev,
        title: d.title,
        reason: "Needs resubmission after owner feedback",
        route: viewerRole === "owner" ? `${basePath}/owner` : `${basePath}?tab=documents`,
        entityType: "document",
        entityId: d.id,
        createdAt: d.created_at,
      });
    }
    sections.push({
      type: "changes_requested",
      label: SECTION_LABELS.changes_requested,
      severity: sev,
      items: items.filter((i) => i.type === "changes_requested"),
    });
  }

  // 3. Open issues
  if (includeOpenIssues && issues.length > 0) {
    for (let i = 0; i < issues.length; i++) {
      const iss = issues[i];
      const sev = severityForIssue(issues.length, i);
      items.push({
        id: `open_issue:${iss.id}`,
        type: "open_issue",
        severity: sev,
        title: iss.title,
        reason: iss.status === "in_review" ? "In review" : "Open",
        route: `${basePath}?tab=issues`,
        entityType: "issue",
        entityId: iss.id,
        createdAt: iss.created_at,
      });
    }
    sections.push({
      type: "open_issue",
      label: SECTION_LABELS.open_issue,
      severity: issues.length >= 3 ? "critical" : "warning",
      items: items.filter((i) => i.type === "open_issue"),
    });
  }

  // Sort items: by type priority, then by created_at desc
  items.sort((a, b) => {
    const pa = TYPE_PRIORITY[a.type];
    const pb = TYPE_PRIORITY[b.type];
    if (pa !== pb) return pa - pb;
    const da = a.createdAt ?? "";
    const db = b.createdAt ?? "";
    return db.localeCompare(da);
  });

  // Reorder sections by type priority
  sections.sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]);

  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const warningCount = items.filter((i) => i.severity === "warning").length;

  return {
    items,
    sections,
    totalCount: items.length,
    criticalCount,
    warningCount,
  };
}
