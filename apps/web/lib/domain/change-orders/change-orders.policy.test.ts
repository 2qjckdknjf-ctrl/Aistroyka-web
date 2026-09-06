import { describe, expect, it, vi } from "vitest";
import { canManageChangeOrders, canReadChangeOrders } from "./change-orders.policy";
import * as clientRequestsPolicy from "@/lib/domain/client-requests/client-requests.policy";
import * as stakeholdersPolicy from "@/lib/domain/stakeholders/stakeholders.policy";

vi.mock("@/lib/domain/client-requests/client-requests.policy", () => ({
  canManageClientRequests: vi.fn(),
}));

vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn(),
}));

describe("change-orders.policy", () => {
  it("delegates manage checks to project-scoped client-request cohort", async () => {
    vi.mocked(clientRequestsPolicy.canManageClientRequests).mockResolvedValue(false);
    const denied = await canManageChangeOrders(
      {} as never,
      {
        tenantId: "t1",
        userId: "worker-1",
        role: "member",
        subscriptionTier: "free",
        clientProfile: "ios_lite",
        traceId: "trace1",
      },
      "p1"
    );
    expect(denied).toBe(false);
    expect(clientRequestsPolicy.canManageClientRequests).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ role: "member" }),
      "p1"
    );

    vi.mocked(clientRequestsPolicy.canManageClientRequests).mockResolvedValue(true);
    const allowed = await canManageChangeOrders(
      {} as never,
      {
        tenantId: "t1",
        userId: "mgr-1",
        role: "member",
        subscriptionTier: "free",
        clientProfile: "web",
        traceId: "trace2",
      },
      "p1"
    );
    expect(allowed).toBe(true);
  });

  it("allows portal stakeholders only through the safe client portal policy", async () => {
    vi.mocked(stakeholdersPolicy.canReadClientPortalView).mockResolvedValue(true);
    const ok = await canReadChangeOrders(
      {} as never,
      {
        tenantId: "t1",
        userId: "stakeholder-user",
        role: "stakeholder",
        subscriptionTier: "free",
        clientProfile: "web",
        traceId: "trace1",
      },
      "p1"
    );

    expect(ok).toBe(true);
    expect(stakeholdersPolicy.canReadClientPortalView).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "p1"
    );
  });
});
