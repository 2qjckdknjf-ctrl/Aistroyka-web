import { describe, expect, it, vi } from "vitest";
import { buildManagerActions } from "./manager-actions.service";
import * as workload from "@/lib/domain/workload/workload.service";

vi.mock("@/lib/domain/workload/workload.service", () => ({
  buildManagerWorkload: vi.fn(),
}));

describe("manager-actions.service", () => {
  const supabase = {} as never;
  const ctx = { tenantId: "t1", userId: "u1", role: "owner" } as never;

  it("maps workload into internal manager action items", async () => {
    vi.mocked(workload.buildManagerWorkload).mockResolvedValue({
      audience: "manager",
      counts: { urgent: 1, high: 0, normal: 0 },
      items: [
        {
          id: "manager:budget:p1",
          audience: "manager",
          kind: "budget_over_planned",
          priority: "urgent",
          title: "Budget over planned — Build",
          reason: "Actual costs exceed planned total for this project.",
          project_id: "p1",
          project_name: "Build",
          linked_entity_type: null,
          linked_entity_id: null,
          action_url: "/dashboard/projects/p1?tab=costs",
          due_state: "blocking",
          status_bucket: "risk",
        },
      ],
    });

    const result = await buildManagerActions(supabase, ctx);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      type: "internal_cost_overrun",
      severity: "critical",
      visibility: "internal_manager_only",
      href: "/dashboard/projects/p1?tab=costs",
    });
    expect(result.counts.critical).toBe(1);
  });

  it("limits the feed to 20 items", async () => {
    vi.mocked(workload.buildManagerWorkload).mockResolvedValue({
      audience: "manager",
      counts: { urgent: 25, high: 0, normal: 0 },
      items: Array.from({ length: 25 }, (_, idx) => ({
        id: `manager:overdue:${idx}`,
        audience: "manager",
        kind: "overdue_milestones",
        priority: "urgent",
        title: `Overdue ${idx}`,
        reason: "Milestone is overdue.",
        project_id: `p${idx}`,
        project_name: `Project ${idx}`,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: `/dashboard/projects/p${idx}?tab=schedule`,
        due_state: "overdue",
        status_bucket: "risk",
      })),
    } as never);

    const result = await buildManagerActions(supabase, ctx);

    expect(result.items).toHaveLength(20);
  });
});
