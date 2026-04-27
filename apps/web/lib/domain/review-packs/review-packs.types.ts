/**
 * Wave 4 Step 18 — Executive review packs (curated read models, not BI).
 */

import type { PortfolioControlState, PortfolioProjectControlRow } from "@/lib/domain/portfolio/portfolio-control.types";

/** Executive posture for a project or portfolio slice */
export type ExecutiveSignalLevel = PortfolioControlState;

export interface ReviewPackSectionMeta {
  /** Why this section exists */
  whyItMatters: string;
  /** What data it summarizes */
  summarizes: string;
  /** What leadership should do with it */
  expectedAction: string;
}

export interface ReviewPackBlockerLine {
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  href: string | null;
}

export interface ProjectBudgetSnapshot {
  currency: string;
  plannedTotal: number;
  actualTotal: number;
  varianceAmount: number;
  overBudget: boolean;
  nearingLimit: boolean;
  /** Short explainable line */
  narrative: string;
}

export interface ProjectHandoverSnapshot {
  ready: boolean;
  blockerCount: number;
  topBlockers: ReviewPackBlockerLine[];
}

export interface ProjectAftercareSnapshot {
  openCount: number;
  narrative: string;
  href: string;
}

export interface ProjectAttentionSnapshot {
  totalPendingDecisions: number;
  totalOpenIssues: number;
  /** From attention summary sections */
  sections: Array<{ label: string; count: number; severity: string }>;
}

export interface RecentChangeLine {
  title: string;
  occurredAt: string;
  href: string;
}

export interface ProjectCommercialSnapshot {
  itemCount: number;
  overdueCount: number;
  outstandingAmount: number;
  currency: string;
  narrative: string;
  href: string;
}

export interface ProjectReviewPack {
  /** ISO timestamp for freshness */
  generatedAt: string;
  projectId: string;
  projectName: string;
  header: {
    executiveSignal: ExecutiveSignalLevel;
    executiveSummary: string;
    projectStatusLabel: string;
    healthLabel: string;
    meta: ReviewPackSectionMeta;
  };
  /** Dominant portfolio-style row (reuse signals) */
  control: PortfolioProjectControlRow;
  budget: ProjectBudgetSnapshot;
  handover: ProjectHandoverSnapshot;
  aftercare: ProjectAftercareSnapshot;
  attention: ProjectAttentionSnapshot;
  /** Top handover blockers (capped) */
  blockers: ReviewPackBlockerLine[];
  /** Curated recent stakeholder/client activity */
  recentChanges: RecentChangeLine[];
  actionFocus: string[];
  /** Wave 4 Step 21 — commercial / billing control snapshot */
  commercial: ProjectCommercialSnapshot;
}

export interface PortfolioReviewPack {
  generatedAt: string;
  header: {
    executiveSignal: ExecutiveSignalLevel;
    narrative: string;
    summaryLine: string;
    meta: ReviewPackSectionMeta;
  };
  distribution: {
    healthy: number;
    attention: number;
    critical: number;
    totalProjects: number;
    limitedTo: number;
  };
  /** Highest priority projects first */
  criticalProjects: PortfolioProjectControlRow[];
  attentionProjects: PortfolioProjectControlRow[];
  /** Healthy count only — omit full list to avoid dump */
  healthyCount: number;
  actionFocus: string[];
  /** Wave 4 Step 20 — open cross-project governance cases (not resolved/archived). */
  governanceEscalations?: {
    openCount: number;
    criticalOpenCount: number;
  };
  /** Wave 4 Step 21 — portfolio commercial pressure (overdue / open unpaid lines). */
  commercialSignals?: {
    overdueCount: number;
    openUnpaidCount: number;
  };
}
