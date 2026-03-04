import { describe, expect, it, vi } from "vitest";
import { enqueueJob, processJobs } from "./job.service";
import * as repo from "./job.repository";

vi.mock("./job.repository", () => ({
  enqueue: vi.fn(),
  claim: vi.fn(),
  emitEvent: vi.fn(),
  markSuccess: vi.fn(),
  markDead: vi.fn(),
  markFailedForRetry: vi.fn(),
}));

describe("job.service", () => {
  describe("enqueueJob", () => {
    it("calls repo.enqueue and emitEvent queued", async () => {
      const mockJob = { id: "j1", tenant_id: "t1", type: "ai_analyze_report", status: "queued" };
      vi.mocked(repo.enqueue).mockResolvedValue(mockJob as any);
      vi.mocked(repo.emitEvent).mockResolvedValue();
      const supabase = {} as any;
      const result = await enqueueJob(supabase, {
        tenant_id: "t1",
        user_id: "u1",
        type: "ai_analyze_report",
        payload: { report_id: "r1" },
        trace_id: "trace1",
      });
      expect(result).toEqual(mockJob);
      expect(repo.emitEvent).toHaveBeenCalledWith(supabase, "j1", "queued", {});
    });
  });

  describe("processJobs", () => {
    it("returns zeros when no jobs claimed", async () => {
      vi.mocked(repo.claim).mockResolvedValue([]);
      const summary = await processJobs({} as any, "worker-1", { limit: 5 });
      expect(summary).toEqual({ processed: 0, success: 0, failed: 0, dead: 0 });
    });
  });
});
