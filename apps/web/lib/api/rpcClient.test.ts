import { describe, expect, it, vi } from "vitest";
import { createAnalysisJobRpc, isMissingCreateAnalysisJobRequestKeyArg } from "./rpcClient";

describe("isMissingCreateAnalysisJobRequestKeyArg", () => {
  it("matches PostgREST missing-overload errors", () => {
    expect(
      isMissingCreateAnalysisJobRequestKeyArg({
        code: "PGRST202",
        message: "Could not find the function public.create_analysis_job with parameters p_request_key",
      })
    ).toBe(true);
    expect(isMissingCreateAnalysisJobRequestKeyArg({ code: "23505", message: "duplicate" })).toBe(false);
  });
});

describe("createAnalysisJobRpc", () => {
  it("retries without p_request_key when the live RPC is still 3-arg", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.create_analysis_job with parameters p_request_key",
        },
      })
      .mockResolvedValueOnce({
        data: { id: "job-1", media_id: "media-1", tenant_id: "t1", status: "queued" },
        error: null,
      });
    const row = await createAnalysisJobRpc({ rpc } as never, {
      p_tenant_id: "t1",
      p_media_id: "media-1",
      p_request_key: "idem-1",
    });
    expect(row.id).toBe("job-1");
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0][1]).toEqual({
      p_tenant_id: "t1",
      p_media_id: "media-1",
      p_priority: "normal",
      p_request_key: "idem-1",
    });
    expect(rpc.mock.calls[1][1]).toEqual({
      p_tenant_id: "t1",
      p_media_id: "media-1",
      p_priority: "normal",
    });
  });
});
