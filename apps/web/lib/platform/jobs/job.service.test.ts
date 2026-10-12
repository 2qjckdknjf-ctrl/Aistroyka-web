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
  requeueUnstarted: vi.fn(),
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
      expect(repo.emitEvent).toHaveBeenCalledWith(supabase, mockJob, "queued", {});
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
      expect(repo.markSuccess).toHaveBeenCalledWith(admin,job);expect(repo.emitEvent).not.toHaveBeenCalledWith(admin,job,"success",{});
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
    it.each([true,false])("requeues only the exact claim after an ownership read error, CAS winner=%s",async winner=>{
      vi.clearAllMocks();
      const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts:1,max_attempts:3,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockResolvedValue([job] as any);
      vi.mocked(repo.ownsClaim).mockRejectedValueOnce(new JobHandlerError("Execution lease verification unavailable",true,"LEASE_CHECK_UNAVAILABLE"));
      vi.mocked(repo.requeueUnstarted).mockResolvedValue(winner);
      const admin={rpc:vi.fn()};
      expect(await processJobs(admin as any,"worker-1",{limit:1})).toEqual({processed:winner?1:0,success:0,failed:winner?1:0,dead:0});
      expect(repo.requeueUnstarted).toHaveBeenCalledWith(admin,job,"Execution lease verification unavailable","LEASE_CHECK_UNAVAILABLE",expect.any(Date));
      expect(handleAiAnalyzeReport).not.toHaveBeenCalled();expect(admin.rpc).not.toHaveBeenCalled();
      expect(vi.mocked(repo.emitEvent).mock.calls.map(c=>c[2])).toEqual(winner?["retry"]:[]);
    });
    it("does not execute a foreign tenant or another worker's returned claim",async()=>{
      vi.clearAllMocks();
      vi.mocked(repo.claim).mockResolvedValueOnce([{id:"j1",tenant_id:"t2",status:"running",locked_by:"worker-1"}] as any).mockResolvedValueOnce([{id:"j2",tenant_id:"t1",status:"running",locked_by:"worker-2"}] as any);
      expect(await processJobs({} as any,"worker-1",{limit:2,tenantId:"t1"})).toEqual({processed:0,success:0,failed:0,dead:0});
      expect(repo.ownsClaim).not.toHaveBeenCalled();expect(repo.emitEvent).not.toHaveBeenCalled();expect(handleAiAnalyzeReport).not.toHaveBeenCalled();
    });
    it("does not preclaim another job after a handler exhausts the time budget",async()=>{
      vi.clearAllMocks();let now=1000;const clock=vi.spyOn(Date,"now").mockImplementation(()=>now);
      const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts:1,max_attempts:3,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockResolvedValue([job] as any);vi.mocked(repo.ownsClaim).mockResolvedValue(true);vi.mocked(repo.markSuccess).mockResolvedValue(true);
      vi.mocked(handleAiAnalyzeReport).mockImplementationOnce(async()=>{now+=10000;});
      const admin={rpc:vi.fn(async()=>({data:true,error:null}))};
      try { expect(await processJobs(admin as any,"worker-1",{limit:3,tenantId:"t1",timeBudgetMs:1000})).toEqual({processed:1,success:1,failed:0,dead:0});
        expect(repo.claim).toHaveBeenCalledTimes(1);expect(repo.claim).toHaveBeenCalledWith(admin,"worker-1",1,"t1");
      } finally { clock.mockRestore(); }
    });
    it.each([4,5])("uses the RPC's current attempt %s for the retry/dead threshold",async attempts=>{
      vi.clearAllMocks();const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts,max_attempts:5,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockResolvedValue([job] as any);vi.mocked(repo.ownsClaim).mockResolvedValue(true);vi.mocked(repo.markDead).mockResolvedValue(true);vi.mocked(repo.markFailedForRetry).mockResolvedValue(true);
      vi.mocked(handleAiAnalyzeReport).mockRejectedValueOnce(new JobHandlerError("Temporary",true));
      const admin={rpc:vi.fn(async()=>({data:true,error:null}))};
      expect(await processJobs(admin as any,"worker-1",{limit:1})).toEqual({processed:1,success:0,failed:attempts===4?1:0,dead:attempts===5?1:0});
      expect(repo.markDead).toHaveBeenCalledTimes(attempts===5?1:0);expect(repo.markFailedForRetry).toHaveBeenCalledTimes(attempts===4?1:0);
    });
    it("refunds an unstarted concurrency-blocked claim without handler execution",async()=>{
      vi.clearAllMocks();const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts:1,max_attempts:3,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockResolvedValue([job] as any);vi.mocked(repo.ownsClaim).mockResolvedValue(true);vi.mocked(repo.requeueUnstarted).mockResolvedValue(true);
      const admin={rpc:vi.fn(async()=>({data:false,error:null}))};
      expect(await processJobs(admin as any,"worker-1",{limit:1})).toEqual({processed:0,success:0,failed:0,dead:0});expect(handleAiAnalyzeReport).not.toHaveBeenCalled();
      expect(repo.requeueUnstarted).toHaveBeenCalledWith(admin,job,"Tenant concurrency cap","CONCURRENCY_CAP",expect.any(Date));expect(repo.markFailedForRetry).not.toHaveBeenCalled();
    });
    it.each(["claim","ownership","slot"].flatMap(phase=>[true,false].map(winner=>({phase,winner}))))("refunds an unstarted lease after $phase delay only on CAS winner=$winner",async ({phase,winner})=>{
      vi.clearAllMocks();vi.mocked(repo.ownsClaim).mockReset();vi.mocked(repo.claim).mockReset();vi.mocked(handleAiAnalyzeReport).mockReset();let now=1000;const clock=vi.spyOn(Date,"now").mockImplementation(()=>now);
      const job={id:"j1",tenant_id:"t1",type:"ai_analyze_report",status:"running",locked_by:"worker-1",locked_at:"2026-10-12T00:00:00.000123Z",attempts:1,max_attempts:3,payload:{report_id:"r1"}};
      vi.mocked(repo.claim).mockImplementationOnce(async()=>{if(phase==="claim")now+=10000;return [job] as any;});
      vi.mocked(repo.ownsClaim).mockImplementationOnce(async()=>{if(phase==="ownership")now+=10000;return true;});
      vi.mocked(repo.requeueUnstarted).mockResolvedValue(winner);
      const admin={rpc:vi.fn(async(name:string)=>{if(name==="try_acquire_job_slot"&&phase==="slot")now+=10000;return {data:true,error:null};})};
      try { expect(await processJobs(admin as any,"worker-1",{limit:3,tenantId:"t1",timeBudgetMs:1000})).toEqual({processed:0,success:0,failed:0,dead:0});
        expect(repo.claim).toHaveBeenCalledTimes(1);expect(handleAiAnalyzeReport).not.toHaveBeenCalled();expect(repo.markSuccess).not.toHaveBeenCalled();
        expect(repo.requeueUnstarted).toHaveBeenCalledWith(admin,job,"Request time budget exhausted before dispatch","TIME_BUDGET",expect.any(Date));
        if(winner)expect(repo.emitEvent).toHaveBeenCalledWith(admin,job,"retry",expect.objectContaining({error_type:"TIME_BUDGET"}));else expect(vi.mocked(repo.emitEvent).mock.calls.map(c=>c[2])).toEqual(phase==="slot"?["locked"]:[]);
        if(phase==="slot")expect(admin.rpc).toHaveBeenCalledWith("release_job_slot",{p_tenant_id:"t1"});else expect(admin.rpc).not.toHaveBeenCalled();
      } finally { clock.mockRestore(); }
    });
  });
});
