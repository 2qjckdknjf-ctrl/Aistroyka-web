import { describe, expect, it } from "vitest";
import { pickNextClientMilestone } from "./next-client-milestone";
import type { ClientVisibleMilestone } from "./client-portal.types";

function milestone(
  partial: Pick<ClientVisibleMilestone, "id" | "title" | "target_date"> & { status?: string },
): ClientVisibleMilestone {
  return { status: "planned", ...partial };
}

describe("pickNextClientMilestone", () => {
  it("returns null when every milestone is closed", () => {
    expect(
      pickNextClientMilestone([
        milestone({ id: "1", title: "A", target_date: "2026-01-01", status: "done" }),
        milestone({ id: "2", title: "B", target_date: "2026-02-01", status: "cancelled" }),
      ]),
    ).toBeNull();
  });

  it("picks the soonest incomplete milestone, including overdue", () => {
    expect(
      pickNextClientMilestone([
        milestone({ id: "done", title: "Done", target_date: "2026-01-01", status: "done" }),
        milestone({ id: "later", title: "Later", target_date: "2026-10-01" }),
        milestone({ id: "soon", title: "Soon", target_date: "2026-08-01" }),
      ])?.id,
    ).toBe("soon");
  });
});
