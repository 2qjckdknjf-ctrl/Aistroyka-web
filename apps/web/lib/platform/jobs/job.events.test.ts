import { expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { emitEvent } from "./job.repository";
const job={id:"job-a",tenant_id:"tenant-a",user_id:"user-a",trace_id:"trace-a",type:"ai_analyze_media" as const,attempts:2,locked_at:"2026-10-12T00:00:00.000123Z"};
it("awaits a real SDK audit insert with tenant scope and excludes raw job/handler content",async()=>{
  let release!:()=>void;const pending=new Promise<void>(r=>{release=r;});let done=false;
  const seen:{url:URL;init:RequestInit|undefined}[]=[];
  const client=createClient("https://queue-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
    seen.push({url:new URL(String(input)),init});await pending;return new Response(null,{status:201});
  }}});
  const writing=emitEvent(client,job,"retry",{message:"secret signed URL",payload:"secret",error_type:"TEMPORARY",run_after:"2026-10-12T01:00:00Z"}).then(()=>{done=true;});
  try {
    await vi.waitFor(()=>expect(seen).toHaveLength(1));expect(done).toBe(false);
    expect(seen[0].url.pathname).toBe("/rest/v1/audit_logs");expect(seen[0].init?.method).toBe("POST");expect(seen[0].init?.signal).toBeTruthy();
    const row=JSON.parse(seen[0].init?.body as string);expect(row).toMatchObject({tenant_id:job.tenant_id,user_id:job.user_id,trace_id:job.trace_id,action:"platform_job_retry",resource_type:"platform_job",resource_id:job.id});
    expect(row.details).toEqual({event:"retry",job_type:job.type,attempts:2,claim_locked_at:job.locked_at,error_type:"TEMPORARY",run_after:"2026-10-12T01:00:00.000Z"});expect(JSON.stringify(row)).not.toContain("secret");
  } finally { release();await writing; }
  expect(done).toBe(true);
});
it.each(["database","transport"])("audit %s failure does not throw or touch the other queue",async kind=>{
  const paths:string[]=[];
  const client=createClient("https://queue-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input)=>{
    paths.push(new URL(String(input)).pathname);
    if(kind==="transport")throw new Error("secret transport details");return Response.json({message:"secret database details"},{status:503});
  }}});
  await expect(emitEvent(client,job,"success")).resolves.toBeUndefined();expect(paths).toEqual(["/rest/v1/audit_logs"]);
});
it("drops malformed error categories and retry dates",async()=>{
  const rows:Record<string,any>[]=[];
  const client=createClient("https://queue-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(_input,init)=>{
    rows.push(JSON.parse(init?.body as string));return new Response(null,{status:201});
  }}});
  await emitEvent(client,job,"failed",{error_type:"https://secret.example",run_after:"secret"});expect(rows).toHaveLength(1);expect(rows[0].details).not.toHaveProperty("error_type");expect(rows[0].details).not.toHaveProperty("run_after");
});
