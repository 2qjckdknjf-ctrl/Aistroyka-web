/**
 * Needs attention / reminders — light MVP
 *
 * Derived actionable queue. No scheduler, no cron.
 * See docs/needs-attention-reminders-mvp.md.
 */

/** Attention item type. */
export type AttentionItemType =
  | "pending_decision"
  | "changes_requested"
  | "open_issue";

/** Severity for prioritization and UI. */
export type AttentionSeverity = "critical" | "warning" | "info";

/** Single actionable attention item. */
export interface AttentionItem {
  id: string;
  type: AttentionItemType;
  severity: AttentionSeverity;
  title: string;
  reason: string;
  /** Route for CTA (e.g. project detail with tab). */
  route: string;
  entityType: "document" | "issue";
  entityId: string;
  /** Optional created_at for sorting within type. */
  createdAt?: string;
}

/** Grouped section in the read model. */
export interface AttentionSection {
  type: AttentionItemType;
  label: string;
  severity: AttentionSeverity;
  items: AttentionItem[];
}

/** Viewer role for filtering. */
export type AttentionViewerRole = "manager" | "owner";

/** Project attention summary — read model. */
export interface ProjectAttentionSummary {
  items: AttentionItem[];
  sections: AttentionSection[];
  totalCount: number;
  criticalCount: number;
  warningCount: number;
}
