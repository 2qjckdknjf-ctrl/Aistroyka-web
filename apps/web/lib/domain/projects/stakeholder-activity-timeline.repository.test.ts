import { describe, expect, it } from "vitest";
import { shapeManagerAudience, shapeStakeholderAudience } from "./stakeholder-activity-timeline.repository";
import type { StakeholderActivityItem } from "./stakeholder-activity-timeline.types";

function item(p: Partial<StakeholderActivityItem>): StakeholderActivityItem {
  return {
    id: "1",
    eventType: "client_request_created",
    occurredAt: "2026-01-01T00:00:00.000Z",
    title: "T",
    description: null,
    projectId: "p1",
    targetUrl: "/x",
    actorId: null,
    visibility: "both",
    actionNeeded: false,
    ...p,
  };
}

describe("stakeholder-activity-timeline.repository", () => {
  it("shapeStakeholderAudience drops internal-only and actorId", () => {
    const raw: StakeholderActivityItem[] = [
      item({ id: "a", visibility: "both" }),
      item({ id: "b", visibility: "internal", title: "Secret" }),
      item({ id: "c", visibility: "stakeholder", title: "Self" }),
    ];
    const out = shapeStakeholderAudience(raw);
    expect(out.map((x) => x.id).sort()).toEqual(["a", "c"]);
    expect(out[0]).not.toHaveProperty("actorId");
    expect(out[0]).not.toHaveProperty("visibility");
  });

  it("shapeManagerAudience keeps internal rows and actorId for audit", () => {
    const raw: StakeholderActivityItem[] = [
      item({ id: "a", visibility: "both" }),
      item({ id: "b", visibility: "internal", title: "Invite sent", actorId: "mgr-1" }),
    ];
    const out = shapeManagerAudience(raw);
    expect(out).toHaveLength(2);
    expect(out[1].visibility).toBe("internal");
    expect(out[1].actorId).toBe("mgr-1");
  });
});
