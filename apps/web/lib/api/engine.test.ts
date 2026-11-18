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

function makeAdmin(opts?: {
  stampError?: { code: string } | null;
  existing?: { id: string; media_id: string; status: string } | null;
}) {
  const stamp = vi.fn(async () => ({ error: opts?.stampError ?? null }));
  const maybeSingle = vi.fn(async () => ({ data: opts?.existing ?? null, error: null }));
  return {
    tag: "admin" as const,
    stamp,
    maybeSingle,
    from: () => ({
      update: () => ({
        eq: () => ({
          eq: () => ({
            is: stamp,
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle,
          }),
        }),
      }),
    }),
  };
}

describe("createAnalysisJob", () => {
  const sessionClient = { tag: "session" };

  beforeEach(() => {
    vi.clearAllMocks();
    createAnalysisJobRpc.mockResolvedValue({
      id: "job-1",
      media_id: "media-1",
      status: "pending",
    });
  });

  it("routes the RPC through the service-role client, not the caller client", async () => {
    const adminClient = makeAdmin();
    getAdminClient.mockReturnValue(adminClient);
    const job = await createAnalysisJob(sessionClient as never, {
      tenant_id: "tenant-1",
      media_id: "media-1",
    });
    expect(job).toEqual({ id: "job-1", media_id: "media-1", status: "pending" });
    expect(createAnalysisJobRpc).toHaveBeenCalledTimes(1);
    expect(createAnalysisJobRpc.mock.calls[0][0]).toBe(adminClient);
    expect(createAnalysisJobRpc.mock.calls[0][0]).not.toBe(sessionClient);
    expect(createAnalysisJobRpc.mock.calls[0][1]).toEqual({
      p_tenant_id: "tenant-1",
      p_media_id: "media-1",
      p_priority: "normal",
    });
  });

  it("passes p_request_key only when a key is requested", async () => {
    const adminClient = makeAdmin();
    getAdminClient.mockReturnValue(adminClient);
    await createAnalysisJob(sessionClient as never, {
      tenant_id: "tenant-1",
      media_id: "media-1",
      request_key: "idem-1",
    });
    expect(createAnalysisJobRpc.mock.calls[0][1]).toEqual({
      p_tenant_id: "tenant-1",
      p_media_id: "media-1",
      p_priority: "normal",
      p_request_key: "idem-1",
    });
    expect(adminClient.stamp).toHaveBeenCalled();
  });

  it("returns the keyed job when a unique stamp race already bound the same media", async () => {
    const adminClient = makeAdmin({
      stampError: { code: "23505" },
      existing: { id: "job-9", media_id: "media-1", status: "queued" },
    });
    getAdminClient.mockReturnValue(adminClient);
    const job = await createAnalysisJob(sessionClient as never, {
      tenant_id: "tenant-1",
      media_id: "media-1",
      request_key: "idem-1",
    });
    expect(job).toEqual({ id: "job-9", media_id: "media-1", status: "queued" });
  });

  it("fails closed when a unique stamp race belongs to other media", async () => {
    const adminClient = makeAdmin({
      stampError: { code: "23505" },
      existing: { id: "job-9", media_id: "media-other", status: "queued" },
    });
    getAdminClient.mockReturnValue(adminClient);
    await expect(
      createAnalysisJob(sessionClient as never, {
        tenant_id: "tenant-1",
        media_id: "media-1",
        request_key: "idem-1",
      })
    ).rejects.toMatchObject({ code: "23505" });
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
