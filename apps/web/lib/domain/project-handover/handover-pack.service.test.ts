import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildOwnerHandoverPack, buildManagerHandoverPack } from "./handover-pack.service";
import type { HandoverPackTranslate } from "./handover-pack.types";
import * as clientPortal from "@/lib/domain/client-portal/client-portal.service";
import * as handoverPolicy from "./project-handover.policy";
import * as defectsService from "@/lib/domain/defects/defects.service";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import * as handoverReadiness from "./handover-readiness";
import * as summaryRepo from "@/lib/domain/projects/project-summary.repository";

vi.mock("@/lib/domain/client-portal/client-portal.service", () => ({
  getClientProjectView: vi.fn(),
}));
vi.mock("./project-handover.policy", () => ({
  canManageProjectHandover: vi.fn(),
  canReadProjectHandover: vi.fn(),
}));
vi.mock("@/lib/domain/defects/defects.service", () => ({
  listDefects: vi.fn(),
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(),
}));
vi.mock("./handover-readiness", () => ({
  computeHandoverReadiness: vi.fn(),
}));
vi.mock("@/lib/domain/projects/project-summary.repository", () => ({
  getProjectSummary: vi.fn(),
}));

const ctx = {
  tenantId: "t1",
  userId: "u1",
  role: "member" as const,
  subscriptionTier: "free" as const,
  clientProfile: "web" as const,
  traceId: "tr",
};

const supabase = {} as never;

/** Shapes strings like production `handoverPack` English messages for assertions */
function enPackTranslate(): HandoverPackTranslate {
  const templates: Record<string, string> = {
    summaryProgress: "{done} / {total} tasks marked complete.",
    summaryMilestones: "{count} customer-visible milestone(s).",
    lineMilestone: "{title} · {status}",
    summaryDocuments: "{total} shared document(s): {approved} approved, {pending} other status.",
    summaryEstimates: "{count} customer-facing estimate record(s).",
    summaryDecisions: "{count} document decision(s) still tracked.",
    lineDecision: "{title} · {kind}",
    summaryRequests: "{open} open request(s) of {total} total.",
    punchListEmpty: "No punch list items recorded.",
    punchListSummary: "{open} open / in progress, {closed} resolved or closed (customer-visible list).",
    minimalProgress: "{projectName}: {done} / {total} tasks complete.",
    minimalPunchEmpty: "No punch list items.",
    minimalPunchSummary: "{open} non-closed item(s) of {total} total.",
    minimalPortalNote:
      "Enable the client portal to align this pack with the full customer-facing project view (milestones, documents, requests).",
    decisionKind_document_review_needed: "Review needed",
    decisionKind_changes_requested: "Changes requested",
    milestoneStatus_active: "Active",
    milestoneStatus_unknown: "{status}",
    readinessBlocker_overdue_milestones_title: "Overdue milestones",
    readinessBlocker_overdue_milestones_detail: "Active milestones are past their target date.",
    readinessBlocker_open_issues_title: "Open issues",
    readinessBlocker_open_issues_detail: "Project issues are not closed.",
    readinessBlocker_pending_report_approvals_title: "Reports awaiting review",
    readinessBlocker_pending_report_approvals_detail: "Submitted field reports need manager review.",
    readinessBlocker_documents_not_final_title: "Documents not finalized",
    readinessBlocker_documents_not_final_detail: "Some documents are not approved or archived.",
    readinessBlocker_open_change_orders_title: "Open change orders",
    readinessBlocker_open_change_orders_detail: "Change orders are still open or not implemented.",
    readinessBlocker_open_discussions_title: "Open stakeholder discussions",
    readinessBlocker_open_discussions_detail: "Structured discussions are still active.",
    readinessBlocker_pending_client_requests_title: "Pending client requests",
    readinessBlocker_pending_client_requests_detail: "The client still has open requests that require action.",
    readinessBlocker_blocking_punch_defects_title: "Blocking punch list items",
    readinessBlocker_blocking_punch_defects_detail:
      "Open defects marked as blocking handover must be cleared or reclassified.",
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

describe("handover-pack.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("owner pack builds sections from client view", async () => {
    vi.mocked(handoverPolicy.canReadProjectHandover).mockResolvedValue(true);
    vi.mocked(clientPortal.getClientProjectView).mockResolvedValue({
      data: {
        project: { id: "p1", name: "House" },
        progress: { tasks_done: 2, tasks_total: 5 },
        milestones: [{ id: "m1", title: "Roof", target_date: "2026-06-01", status: "active" }],
        documents: [
          { id: "d1", title: "Act", type: "act", status: "approved", updated_at: "2026-01-01" },
        ],
        decisions: [],
        customer_estimates: [],
        client_requests: [],
        capabilities: { can_respond_to_requests: false },
        handover: {
          status: "in_progress",
          handover_notes: null,
          handed_over_at: null,
          completed_at: null,
        },
      },
      error: "",
    });
    vi.mocked(defectsService.listDefects).mockResolvedValue({
      data: [{ id: "x1", title: "Paint", status: "open", is_blocking: false, due_date: null, updated_at: "2026-01-01" }],
      error: "",
    });

    const { data, error } = await buildOwnerHandoverPack(supabase, ctx, "p1", enPackTranslate());
    expect(error).toBe("");
    expect(data?.audience).toBe("owner");
    expect(data?.sections.find((s) => s.id === "punch_list")?.summary).toMatch(/open/i);
  });

  it("manager pack falls back when portal view missing", async () => {
    vi.mocked(handoverPolicy.canManageProjectHandover).mockResolvedValue(true);
    vi.mocked(projectRepo.getById).mockResolvedValue({ id: "p1", name: "Tower", tenant_id: "t1" } as never);
    vi.mocked(handoverReadiness.computeHandoverReadiness).mockResolvedValue({ ready: false, blockers: [] });
    vi.mocked(clientPortal.getClientProjectView).mockResolvedValue({ data: null, error: "no portal" });
    vi.mocked(defectsService.listDefects).mockResolvedValue({ data: [], error: "" });
    vi.mocked(summaryRepo.getProjectSummary).mockResolvedValue({
      tasksDone: 1,
      tasksTotal: 3,
    } as never);

    const { data, error } = await buildManagerHandoverPack(supabase, ctx, "p1", enPackTranslate());
    expect(error).toBe("");
    expect(data?.portal_preview_full).toBe(false);
    expect(data?.sections.some((s) => s.id === "portal_note")).toBe(true);
  });
});
