import { describe, expect, it } from "vitest";
import {
  buildManagerDigestLinesFromSummary,
  buildOwnerDigestLinesFromClientView,
} from "./daily-digest.service";
import type { DailyDigestTranslate } from "./daily-digest.types";
import type { ProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";

function baseSummary(over: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    activeWorkers: 0,
    openReports: 0,
    aiAnalyses: 0,
    tasksTotal: 10,
    tasksInProgress: 2,
    tasksDone: 5,
    milestonesCount: 3,
    overdueMilestonesCount: 0,
    pendingReportApprovalsCount: 0,
    pendingDecisionsCount: 0,
    openIssuesCount: 0,
    budgetOverBudget: false,
    budgetNearingLimit: false,
    costLineOverrunCount: 0,
    budgetItemCount: 0,
    budgetCurrency: "RUB",
    budgetPlannedTotal: 0,
    budgetActualTotal: 0,
    budgetVarianceAmount: 0,
    commercialItemCount: 0,
    commercialOverdueCount: 0,
    commercialOutstandingAmount: 0,
    ...over,
  };
}

function enDailyDigestT(): DailyDigestTranslate {
  const templates: Record<string, string> = {
    mgrLine_progress: "{projectName}: {done}/{total} tasks completed; {inProgress} in progress.",
    mgrLine_budget_over:
      "{projectName}: internal budget signals show actual above planned — review internal costs.",
    mgrLine_budget_near:
      "{projectName}: internal spend is near the planned ceiling — confirm cost control.",
    mgrLine_milestones: "{projectName}: {count} active milestone(s) past target date.",
    mgrLine_reports: "{projectName}: {count} field report(s) awaiting review.",
    mgrLine_documents: "{projectName}: {count} document(s) in review queue.",
    mgrLine_issues: "{projectName}: {count} open issue(s) not resolved.",
    mgrLine_commercial: "{projectName}: {count} commercial record(s) overdue or need follow-up.",
    ownLine_progress: "Progress: {done}/{total} tasks marked complete for {projectName}.",
    ownLine_requests: "You have {count} open item(s) awaiting your response or approval.",
    ownLine_decisions: "{count} shared document(s) need your review or follow-up.",
    ownLine_milestone: "Upcoming milestone: {title} · {date}.",
    ownLine_commercial:
      "{count} estimate or commercial approval(s) are past the agreed follow-up date.",
    ownLine_handover: "Handover preparation is in progress for {projectName}.",
  };
  return (key, values) => {
    let s = templates[key] ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        s = s.split(`{${k}}`).join(String(v));
      }
    }
    return s;
  };
}

describe("daily-digest.service", () => {
  it("manager digest includes internal budget signal when over planned", () => {
    const lines = buildManagerDigestLinesFromSummary(
      "p1",
      "Tower",
      baseSummary({ budgetOverBudget: true }),
      enDailyDigestT()
    );
    const joined = lines.map((l) => l.text).join(" ");
    expect(joined).toMatch(/internal budget/i);
  });

  it("owner digest text never exposes internal finance phrases from client view", () => {
    const view: ClientProjectView = {
      project: { id: "p1", name: "Tower" },
      progress: { tasks_done: 2, tasks_total: 5 },
      milestones: [
        {
          id: "m1",
          title: "Drywall",
          target_date: "2099-01-01",
          status: "active",
        },
      ],
      documents: [],
      decisions: [{ id: "d1", title: "Spec", type: "pdf", kind: "document_review_needed" }],
      customer_estimates: [],
      client_requests: [
        {
          id: "r1",
          kind: "approve_or_reject",
          action_mode: "action_required",
          status: "open",
          title: "Approve estimate",
          instructions: null,
          choice_options: null,
          linked_entity_type: null,
          linked_entity_id: null,
          decision_type: "estimate_approval",
          priority: "high",
          due_at: "2026-01-01T00:00:00Z",
          customer_visible_amount: 1000,
          customer_visible_currency: "EUR",
          requested_at: "2026-01-01T00:00:00Z",
          responded_at: null,
          response_value: null,
          response_note: null,
          completed_at: null,
        },
      ],
      capabilities: { can_respond_to_requests: true },
      handover: { status: "in_progress", handover_notes: null, handed_over_at: null, completed_at: null },
    };
    const lines = buildOwnerDigestLinesFromClientView(view, enDailyDigestT(), "en");
    const joined = lines.map((l) => l.text).join(" | ").toLowerCase();
    expect(joined).not.toMatch(/\bmargin\b|\bprofit\b|planned total|actual cost|internal budget|subcontractor/i);
  });

  it("owner digest with no activity yields no lines and stays finance-safe", () => {
    const view: ClientProjectView = {
      project: { id: "p1", name: "Tower" },
      progress: { tasks_done: 0, tasks_total: 0 },
      milestones: [],
      documents: [],
      decisions: [],
      customer_estimates: [],
      client_requests: [],
      capabilities: { can_respond_to_requests: false },
      handover: null,
    };
    expect(buildOwnerDigestLinesFromClientView(view, enDailyDigestT(), "en")).toEqual([]);
  });
});
