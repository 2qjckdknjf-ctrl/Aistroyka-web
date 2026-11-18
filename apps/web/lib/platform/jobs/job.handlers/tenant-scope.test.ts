import { beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handleRetentionCleanup } from "./retention-cleanup";
import { handlePushSend } from "./push-send";
import { handleUploadReconcile } from "./upload-reconcile";
import { JobPayloadError } from "../job.errors";
import type { Job } from "../job.types";
import { attemptSend } from "@/lib/platform/push/push.provider.router";
import { logStructured } from "@/lib/observability";
vi.mock("@/lib/platform/push/push.provider.router",()=>({attemptSend:vi.fn().mockResolvedValue({ok:true})}));
vi.mock("@/lib/observability",()=>({logStructured:vi.fn()}));
beforeEach(()=>vi.clearAllMocks());
const job={tenant_id:"tenant-a",payload:{}} as Job;
type RequestSeen={url:URL;init:RequestInit|undefined};
function fixture(reply:(request:RequestSeen)=>Response){
  const seen:RequestSeen[]=[];
  const client=createClient("https://scope-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
    const request={url:new URL(String(input)),init};seen.push(request);return reply(request);
  }}});
  return {client,seen};
}
it.each([handleRetentionCleanup,handlePushSend])("denies a payload tenant override before any privileged request",async handler=>{
  const f=fixture(()=>Response.json([]));await expect(handler(f.client,{...job,payload:{tenant_id:"tenant-b"}} as Job)).rejects.toBeInstanceOf(JobPayloadError);expect(f.seen).toEqual([]);expect(attemptSend).not.toHaveBeenCalled();
});
it.each([handleRetentionCleanup,handlePushSend,handleUploadReconcile])("denies a missing server job tenant before any privileged request",async handler=>{
  const f=fixture(()=>Response.json([]));await expect(handler(f.client,{...job,tenant_id:""})).rejects.toBeInstanceOf(JobPayloadError);expect(f.seen).toEqual([]);
});
it.each([-1,NaN,Infinity,Number.MAX_VALUE,"future"])("rejects invalid upload expiration age %s",async age=>{
  const f=fixture(()=>Response.json([]));await expect(handleUploadReconcile(f.client,{...job,payload:{max_age_minutes:age}} as Job)).rejects.toBeInstanceOf(JobPayloadError);expect(f.seen).toEqual([]);
});
it("push ignores an unexpected foreign row before token lookup or provider I/O",async()=>{
  const f=fixture(()=>Response.json([{id:"foreign",tenant_id:"tenant-b",user_id:"other",platform:"ios",type:"task_message",payload:{},attempts:0}]));
  await handlePushSend(f.client,job);expect(f.seen).toHaveLength(1);expect(f.seen[0].url.pathname).toBe("/rest/v1/push_outbox");expect(f.seen[0].url.searchParams.get("tenant_id")).toBe("eq.tenant-a");expect(attemptSend).not.toHaveBeenCalled();
});
it("own-tenant push uses tenant scope for selection, token lookup and acknowledgement",async()=>{
  const f=fixture(({url,init})=>{
    if(init?.method==="PATCH")return new Response(null,{status:204});
    if(url.pathname.endsWith("push_outbox"))return Response.json([{id:"own",tenant_id:"tenant-a",user_id:"user-a",platform:"ios",type:"task_message",payload:{},attempts:0}]);
    return Response.json([{device_id:"device-a",token:"synthetic-token"}]);
  });
  await handlePushSend(f.client,job);expect(attemptSend).toHaveBeenCalledTimes(1);expect(f.seen).toHaveLength(3);
  for(const request of f.seen)expect(request.url.searchParams.get("tenant_id")).toBe("eq.tenant-a");
  const ack=f.seen.find(r=>r.init?.method==="PATCH")!;expect(ack.url.searchParams.get("id")).toBe("eq.own");expect(ack.url.searchParams.get("status")).toBe("eq.queued");expect(JSON.parse(ack.init?.body as string)).toEqual({status:"sent"});
});
it("reconcile rechecks tenant, expiration, archive and lifecycle after selection",async()=>{
  const f=fixture(({init})=>init?.method==="PATCH"?Response.json([]):Response.json([{id:"own",tenant_id:"tenant-a"},{id:"foreign",tenant_id:"tenant-b"}]));
  await handleUploadReconcile(f.client,job);expect(f.seen).toHaveLength(2);
  const [read,write]=f.seen;
  for(const request of f.seen){expect(request.url.searchParams.get("tenant_id")).toBe("eq.tenant-a");expect(request.url.searchParams.get("status")).toBe("in.(created,uploaded)");expect(request.url.searchParams.get("archived_at")).toBe("is.null");}
  expect(write.url.searchParams.get("id")).toBe("in.(own)");expect(write.url.searchParams.get("expires_at")).toBe(read.url.searchParams.get("expires_at"));
  expect(JSON.parse(write.init?.body as string)).toEqual({status:"expired"});expect(logStructured).not.toHaveBeenCalled();
});
it.each(["read","write"])("reconcile %s failure is retryable rather than a false success",async phase=>{
  const f=fixture(({init})=>((phase==="write")===(init?.method==="PATCH"))?Response.json({message:"unavailable"},{status:400}):Response.json([{id:"own",tenant_id:"tenant-a"}]));
  await expect(handleUploadReconcile(f.client,job)).rejects.toMatchObject({retryable:true,code:phase==="read"?"RECONCILE_READ_FAILED":"RECONCILE_WRITE_FAILED"});expect(logStructured).not.toHaveBeenCalled();
});
