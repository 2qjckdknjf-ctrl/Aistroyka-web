import { describe, expect, it, vi } from "vitest";
import { canReadChangeOrders } from "./change-orders.policy";
import * as stakeholdersPolicy from "@/lib/domain/stakeholders/stakeholders.policy";

vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn(),
}));

describe("change-orders.policy", () => {
  it("allows portal stakeholders only through the safe client portal policy", async () => {
    vi.mocked(stakeholdersPolicy.canReadClientPortalView).mockResolvedValue(true);
    const ok = await canReadChangeOrders({} as never, {
      tenantId: "t1",
      userId: "stakeholder-user",
      role: "stakeholder",
      subscriptionTier: "free",
      clientProfile: "web",
      traceId: "trace1",
    }, "p1");

    expect(ok).toBe(true);
    expect(stakeholdersPolicy.canReadClientPortalView).toHaveBeenCalledWith(expect.anything(), expect.anything(), "p1");
  });
});
