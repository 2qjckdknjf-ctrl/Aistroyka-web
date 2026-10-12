import { expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { markSuccess, markDead, markFailedForRetry, ownsClaim } from "./job.repository";
import type { JobClaim } from "./queue/queue.interface";
const claim:JobClaim={id:"job-a",tenant_id:"tenant-a",locked_by:"worker-a",locked_at:"2026-10-12T00:00:00.000123Z",attempts:2};
function fixture(changed:Record<string,unknown>={}) {
  const state:Record<string,unknown>={...claim,status:"running",...changed};let calls=0;
  const client={from:()=>{
    calls++;const filters:Record<string,unknown>={};let patch:Record<string,unknown>|null=null;
    const q={update:(value:Record<string,unknown>)=>{patch=value;return q;},select:()=>q,
      eq:(key:string,value:unknown)=>{filters[key]=value;return q;},maybeSingle:async()=>{
        if(Object.entries(filters).some(([k,v])=>state[k]!==v))return {data:null,error:null};
        if(patch)Object.assign(state,patch);return {data:{id:state.id},error:null};
      }};return q;
  }} as unknown as SupabaseClient;
  return {client,state,calls:()=>calls};
}
const transitions=[(c:SupabaseClient,j:JobClaim)=>markSuccess(c,j),
  (c:SupabaseClient,j:JobClaim)=>markDead(c,j,"failure","VALIDATION"),
  (c:SupabaseClient,j:JobClaim)=>markFailedForRetry(c,j,"failure","TEMPORARY",new Date())];
it.each(transitions)("never mutates a replaced claim for any terminal/retry action",async transition=>{
  const f=fixture({locked_by:"worker-b",locked_at:"2026-10-12T00:01:00.000124Z",attempts:3});const before={...f.state};
  expect(await transition(f.client,claim)).toBe(false);expect(f.state).toEqual(before);
});
it.each([{tenant_id:"other-tenant"},{status:"success"},{attempts:3},{locked_at:"2026-10-12T00:00:00.000124Z"}])("rejects foreign/terminal/later claims %j",async changed=>{
  const f=fixture(changed);expect(await ownsClaim(f.client,claim)).toBe(false);expect(await markSuccess(f.client,claim)).toBe(false);
});
it("only the winning completion changes state and a duplicate acknowledgement is false",async()=>{
  const f=fixture();expect(await ownsClaim(f.client,claim)).toBe(true);expect(await markSuccess(f.client,claim)).toBe(true);
  expect(f.state.status).toBe("success");expect(f.state.locked_by).toBeNull();expect(await markSuccess(f.client,claim)).toBe(false);
});
it("fails closed before querying for missing lease fields",async()=>{
  const f=fixture();expect(await markSuccess(f.client,{...claim,locked_at:null})).toBe(false);expect(f.calls()).toBe(0);
});
it("the real SDK encodes every CAS field and preserves microseconds",async()=>{
  const seen:URL[]=[];
  const client=createClient("https://queue-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},
    global:{fetch:async(input,init)=>{
      const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
      expect(url.hostname).toBe("queue-fixture.invalid");expect(init?.method).toBe("PATCH");seen.push(url);
      expect(JSON.parse(init?.body as string)).toMatchObject({status:"success",locked_by:null,locked_at:null});
      return Response.json({id:claim.id});
    }}});
  expect(await markSuccess(client,claim)).toBe(true);expect(seen).toHaveLength(1);
  const query=seen[0].searchParams;
  for(const [key,value] of Object.entries({...claim,status:"running"}))expect(query.get(key)).toBe("eq."+value);
});
it("distinguishes an SDK read failure from a missing or replaced lease",async()=>{
  const client=createClient("https://queue-fixture.invalid","synthetic-key",{auth:{persistSession:false,autoRefreshToken:false},
    // A non-retried response exercises the repository error contract without
    // depending on SDK-version-specific 503 backoff durations.
    global:{fetch:async()=>Response.json({message:"unavailable",code:"08006"},{status:400})}});
  await expect(ownsClaim(client,claim)).rejects.toMatchObject({code:"LEASE_CHECK_UNAVAILABLE",retryable:true});
});
