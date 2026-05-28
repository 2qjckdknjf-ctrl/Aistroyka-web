import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const adminState = vi.hoisted(() => ({
  client: null as Pick<SupabaseClient, "rpc"> | null,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => adminState.client),
}));

import { createAnalysisJob } from "./engine";

function rpcClient(
  data: unknown = {
    id: "job-1",
    media_id: "media-1",
    status: "pending",
  }
): Pick<SupabaseClient, "rpc"> {
  return {
    rpc: vi.fn(async () => ({ data, error: null })),
  } as unknown as Pick<SupabaseClient, "rpc">;
}

describe("createAnalysisJob", () => {
  beforeEach(() => {
    adminState.client = null;
  });

  it("uses the service-role client for the server-only create_analysis_job RPC", async () => {
    const userClient = rpcClient();
    const adminClient = rpcClient();
    adminState.client = adminClient;

    await expect(
      createAnalysisJob(userClient as SupabaseClient, {
        tenant_id: "tenant-1",
        media_id: "media-1",
        priority: "high",
      })
    ).resolves.toEqual({
      id: "job-1",
      media_id: "media-1",
      status: "pending",
    });

    expect(userClient.rpc).not.toHaveBeenCalled();
    expect(adminClient.rpc).toHaveBeenCalledWith("create_analysis_job", {
      p_tenant_id: "tenant-1",
      p_media_id: "media-1",
      p_priority: "high",
    });
  });

  it("fails closed when the service-role client is not configured", async () => {
    const userClient = rpcClient();

    await expect(
      createAnalysisJob(userClient as SupabaseClient, {
        tenant_id: "tenant-1",
        media_id: "media-1",
      })
    ).rejects.toThrow("SUPABASE_SERVICE_ROLE_KEY");

    expect(userClient.rpc).not.toHaveBeenCalled();
  });
});
