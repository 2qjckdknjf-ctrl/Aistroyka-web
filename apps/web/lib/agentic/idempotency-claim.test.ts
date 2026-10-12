import { describe, expect, it, vi } from "vitest";
import { claimAgentIdempotencyKey, releaseAgentIdempotencyKey } from "./idempotency-claim";

const scope = {
  tenantId: "11111111-1111-1111-1111-111111111111",
  projectId: "22222222-2222-2222-2222-222222222222",
  userId: "33333333-3333-3333-3333-333333333333",
  key: "retry-1",
};

describe("agent idempotency reservation", () => {
  it("returns the claim token for the scoped key", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "44444444-4444-4444-4444-444444444444",
      error: null,
    });
    await expect(claimAgentIdempotencyKey({ rpc } as never, scope)).resolves.toBe(
      "44444444-4444-4444-4444-444444444444"
    );
    expect(rpc).toHaveBeenCalledWith(
      "claim_agent_idempotency_key",
      expect.objectContaining({
        p_tenant_id: scope.tenantId,
        p_project_id: scope.projectId,
        p_actor_user_id: scope.userId,
        p_idempotency_key: scope.key,
      })
    );
  });

  it("returns null when another live request owns the key", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(claimAgentIdempotencyKey({ rpc } as never, scope)).resolves.toBeNull();
  });

  it("fails closed when claim persistence is unavailable", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(claimAgentIdempotencyKey({ rpc } as never, scope)).rejects.toMatchObject({
      code: "AGENT_GOVERNANCE_UNAVAILABLE",
      message: "agent_idempotency_claim_failed",
    });
  });

  it("releases only the matching scoped claim token", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    await expect(
      releaseAgentIdempotencyKey(
        { rpc } as never,
        scope,
        "44444444-4444-4444-4444-444444444444"
      )
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith(
      "release_agent_idempotency_key",
      expect.objectContaining({
        p_idempotency_key: scope.key,
        p_claim_token: "44444444-4444-4444-4444-444444444444",
      })
    );
  });
});
