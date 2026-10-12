import { expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { recoverExpiredMaintenanceClaims } from "./job.recovery";
const old="2026-10-03T08:14:59.458083Z";
const base={id:"own",tenant_id:"tenant-a",user_id:null,trace_id:null,type:"upload_reconcile",status:"running",locked_by:"worker-a",locked_at:old,attempts:1,max_attempts:3,payload:{}};
function fixture(options:{replacement?:boolean;typeChanged?:boolean;error?:boolean;exhausted?:boolean}={}){
  const state={...base,max_attempts:options.exhausted?1:3};const calls:{url:URL;init:RequestInit|undefined}[]=[];
  const injected=[{...base,id:"foreign",tenant_id:"tenant-b"},{...base,id:"current",locked_at:new Date().toISOString()},{...base,id:"push",type:"push_send"},{...base,id:"ai",type:"ai_analyze_media"},{...base,id:"missing",locked_by:null}];
  const client=createClient("https://recovery-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
    const url=new URL(String(input));calls.push({url,init});
    if(url.pathname.endsWith("audit_logs"))return new Response(null,{status:201});
    if(init?.method==="GET")return options.error?Response.json({message:"unavailable"},{status:400}):Response.json([{...state},...injected]);
    if(options.typeChanged)state.type="ai_analyze_media";
    if(options.replacement){state.locked_at="2026-10-12T03:00:00.000124Z";state.attempts=2;}
    const params=JSON.parse(init?.body as string);
    if(params.p_job_id!==state.id||params.p_tenant_id!==state.tenant_id||params.p_expected_type!==state.type
      ||params.p_locked_at!==state.locked_at||params.p_worker_id!==state.locked_by||params.p_attempt!==state.attempts)return Response.json(null);
    state.status=state.attempts>=state.max_attempts?"dead":"queued";state.locked_by=null as any;state.locked_at=null as any;return Response.json(state.status);
  }}});
  return {client,state,calls};
}
it("recovers only scoped expired maintenance and preserves its execution attempt",async()=>{
  const f=fixture();expect(await recoverExpiredMaintenanceClaims(f.client,"tenant-a")).toEqual({requeued:1,dead:0});expect(f.state).toMatchObject({status:"queued",attempts:1,locked_by:null,locked_at:null});
  expect(f.calls).toHaveLength(3);const [read,write,audit]=f.calls;
  expect(read.url.searchParams.get("tenant_id")).toBe("eq.tenant-a");expect(read.url.searchParams.get("status")).toBe("eq.running");expect(read.url.searchParams.get("type")).toBe("in.(upload_reconcile,ops_events_prune,retention_cleanup)");expect(read.url.searchParams.get("limit")).toBe("20");expect(read.url.searchParams.get("locked_at")).toMatch(/^lt\./);
  expect(write.init?.method).toBe("POST");expect(write.url.pathname).toBe("/rest/v1/rpc/recover_expired_platform_job_claim");expect(JSON.parse(write.init?.body as string)).toMatchObject({p_job_id:"own",p_tenant_id:"tenant-a",p_worker_id:"worker-a",p_locked_at:old,p_attempt:1,p_expected_type:"upload_reconcile"});
  expect(audit.url.pathname).toBe("/rest/v1/audit_logs");expect(JSON.parse(audit.init?.body as string)).toMatchObject({tenant_id:"tenant-a",resource_id:"own",action:"platform_job_retry",details:{error_type:"EXPIRED_MAINTENANCE_LEASE"}});
});
it("does not clear a renewed same-worker lease or emit a false recovery",async()=>{
  const f=fixture({replacement:true});expect(await recoverExpiredMaintenanceClaims(f.client,"tenant-a")).toEqual({requeued:0,dead:0});expect(f.calls).toHaveLength(2);expect(f.state).toMatchObject({status:"running",locked_by:"worker-a",locked_at:"2026-10-12T03:00:00.000124Z",attempts:2});
});
it("denies absent tenant scope before any network request",async()=>{
  const f=fixture();await expect(recoverExpiredMaintenanceClaims(f.client,"")).rejects.toMatchObject({retryable:false});expect(f.calls).toEqual([]);
});
it("reports lookup failure rather than pretending no expired claims exist",async()=>{
  const f=fixture({error:true});await expect(recoverExpiredMaintenanceClaims(f.client,"tenant-a")).rejects.toMatchObject({retryable:true,code:"MAINTENANCE_RECOVERY_UNAVAILABLE"});expect(f.calls).toHaveLength(1);
});

it("does not requeue a concurrently reclassified provider job",async()=>{
  const f=fixture({typeChanged:true});expect(await recoverExpiredMaintenanceClaims(f.client,"tenant-a")).toEqual({requeued:0,dead:0});expect(f.calls).toHaveLength(2);expect(f.state).toMatchObject({status:"running",type:"ai_analyze_media",locked_at:old,attempts:1});
});

it("records exhausted expiry as dead without inventing another retry",async()=>{
  const f=fixture({exhausted:true});expect(await recoverExpiredMaintenanceClaims(f.client,"tenant-a")).toEqual({requeued:0,dead:1});expect(f.state.status).toBe("dead");expect(f.state.attempts).toBe(1);
  const audit=f.calls.find(c=>c.url.pathname==="/rest/v1/audit_logs")!;expect(JSON.parse(audit.init?.body as string)).toMatchObject({action:"platform_job_dead",details:{error_type:"MAX_ATTEMPTS_EXPIRED"}});
});
