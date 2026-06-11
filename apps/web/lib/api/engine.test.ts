import { beforeEach, describe, expect, it, vi } from "vitest";

const createAnalysisJobRpc = vi.fn();
const getAdminClient = vi.fn();

vi.mock("./rpcClient", () => ({
  createAnalysisJobRpc: (...args: unknown[]) => createAnalysisJobRpc(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

import { createAnalysisJob } from "./engine";

describe("createAnalysisJob", () => {
  const sessionClient = { tag: "session" };
  const adminClient = { tag: "admin" };

  beforeEach(() => {
    vi.clearAllMocks();
    createAnalysisJobRpc.mockResolvedValue({
      id: "job-1",
      media_id: "media-1",
      status: "pending",
    });
  });

  it("routes the RPC through the service-role client, not the caller client", async () => {
    getAdminClient.mockReturnValue(adminClient);
    const job = await createAnalysisJob(sessionClient as never, {
      tenant_id: "tenant-1",
      media_id: "media-1",
    });
    expect(job).toEqual({ id: "job-1", media_id: "media-1", status: "pending" });
    expect(createAnalysisJobRpc).toHaveBeenCalledTimes(1);
    expect(createAnalysisJobRpc.mock.calls[0][0]).toBe(adminClient);
    expect(createAnalysisJobRpc.mock.calls[0][0]).not.toBe(sessionClient);
  });

  it("fails closed with a configuration error when service role key is unavailable", async () => {
    getAdminClient.mockReturnValue(null);
    await expect(
      createAnalysisJob(sessionClient as never, {
        tenant_id: "tenant-1",
        media_id: "media-1",
      })
    ).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(createAnalysisJobRpc).not.toHaveBeenCalled();
  });
});
