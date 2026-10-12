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
  ownsClaim: vi.fn(),
}));
vi.mock("./job.handlers/ai-analyze-report", () => ({ handleAiAnalyzeReport: vi.fn() }));
import { handleAiAnalyzeReport } from "./job.handlers/ai-analyze-report";
import { JobHandlerError } from "./job.errors";

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

    it("returns existing job when enqueue is idempotent (same dedupe_key)", async () => {
      const existingJob = { id: "j0", tenant_id: "t1", type: "ai_analyze_report", status: "queued" };
      vi.mocked(repo.enqueue).mockResolvedValue(existingJob as any);
      vi.mocked(repo.emitEvent).mockResolvedValue();
      const supabase = {} as any;
      const result = await enqueueJob(supabase, {
        tenant_id: "t1",
        user_id: "u1",
        type: "ai_analyze_report",
        payload: { report_id: "r1" },
        trace_id: "trace1",
        dedupe_key: "report-r1-submit",
      });
      expect(result).toEqual(existingJob);
      expect(repo.enqueue).toHaveBeenCalledWith(supabase, expect.objectContaining({ dedupe_key: "report-r1-submit" }));
    });
  });

  describe("processJobs", () => {
    it("returns zeros when no jobs claimed", async () => {
      vi.mocked(repo.claim).mockResolvedValue([]);
      const summary = await processJobs({} as any, "worker-1", { limit: 5 });
      expect(summary).toEqual({ processed: 0, success: 0, failed: 0, dead: 0 });
    });
    it("does not report success after a handler loses its lease",async()=>{
      vi.clearAllMocks();
      const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts:0,max_attempts:3,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockResolvedValue([job] as any);vi.mocked(repo.ownsClaim).mockResolvedValue(true);
      vi.mocked(repo.markSuccess).mockResolvedValue(false);vi.mocked(handleAiAnalyzeReport).mockResolvedValue(undefined);
      const admin={rpc:vi.fn(async()=>({data:true,error:null}))};
      expect(await processJobs(admin as any,"worker-1",{limit:1,tenantId:"t1"})).toEqual({processed:0,success:0,failed:0,dead:0});
      expect(repo.markSuccess).toHaveBeenCalledWith(admin,job);expect(repo.emitEvent).not.toHaveBeenCalledWith(admin,"j1","success",{});
      expect(admin.rpc).toHaveBeenCalledWith("release_job_slot",{p_tenant_id:"t1"});
    });
    it("skips a no-longer-owned claim before invoking the handler",async()=>{
      vi.clearAllMocks();
      vi.mocked(repo.claim).mockResolvedValue([{id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1"}] as any);
      vi.mocked(repo.ownsClaim).mockResolvedValue(false);
      expect(await processJobs({} as any,"worker-1",{limit:1})).toEqual({processed:0,success:0,failed:0,dead:0});
      expect(handleAiAnalyzeReport).not.toHaveBeenCalled();expect(repo.markSuccess).not.toHaveBeenCalled();
      expect(repo.emitEvent).not.toHaveBeenCalled();
    });
    it("does not mark or count retry when failure belongs to an expired claim",async()=>{
      vi.clearAllMocks();
      const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts:0,max_attempts:3,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockResolvedValue([job] as any);vi.mocked(repo.ownsClaim).mockResolvedValue(true);
      vi.mocked(handleAiAnalyzeReport).mockRejectedValueOnce(new JobHandlerError("Temporary",true));
      vi.mocked(repo.markFailedForRetry).mockResolvedValue(false);
      const admin={rpc:vi.fn(async()=>({data:true,error:null}))};
      expect(await processJobs(admin as any,"worker-1",{limit:1})).toEqual({processed:0,success:0,failed:0,dead:0});
      expect(repo.markDead).not.toHaveBeenCalled();
      expect(vi.mocked(repo.emitEvent).mock.calls.map(c=>c[2])).toEqual(["locked"]);
      expect(admin.rpc).toHaveBeenCalledWith("release_job_slot",{p_tenant_id:"t1"});
    });
    it("does not execute a foreign tenant or another worker's returned claim",async()=>{
      vi.clearAllMocks();
      vi.mocked(repo.claim).mockResolvedValue([{id:"j1",tenant_id:"t2",status:"running",locked_by:"worker-1"},{id:"j2",tenant_id:"t1",status:"running",locked_by:"worker-2"}] as any);
      expect(await processJobs({} as any,"worker-1",{limit:2,tenantId:"t1"})).toEqual({processed:0,success:0,failed:0,dead:0});
      expect(repo.ownsClaim).not.toHaveBeenCalled();expect(repo.emitEvent).not.toHaveBeenCalled();expect(handleAiAnalyzeReport).not.toHaveBeenCalled();
    });
  });
});
