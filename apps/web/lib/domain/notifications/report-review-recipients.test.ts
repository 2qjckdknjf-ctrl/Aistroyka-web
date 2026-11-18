import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyProjectManagers, notifyProjectReportReviewers, notifyTenantReportReviewers } from "./manager-notifications.repository";
function fixture(project: {user_id:string;role:string;status:string}[] = [], failProject=false, legacyOnly=false) {
  const inserts: {user_id:string}[]=[];
  const tenant=[{user_id:"owner",role:"owner"},{user_id:"admin",role:"admin"},{user_id:"worker",role:"member"},{user_id:"customer",role:"stakeholder"}];
  const from=vi.fn((table:string) => {
    if(table==="tenants") return {select:()=>({eq:()=>({maybeSingle:async()=>({data:{user_id:legacyOnly?"legacy-owner":"owner"}})})})};
    if(table==="manager_notifications") return {insert:vi.fn(async (rows:{user_id:string}[]) => {inserts.push(...rows);return {error:null};})};
    let rows: Record<string,string>[] = table==="project_members"?project:legacyOnly?tenant.filter(r=>r.role!=="owner" && r.role!=="admin"):tenant;
    const query={select:()=>query,eq:(key:string,value:string)=>{if(key==="status")rows=rows.filter(r=>r[key]===value);return query;},
      in:(key:string,values:string[])=>{rows=rows.filter(r=>values.includes(r[key]));return query;},
      then:(resolve:(result:unknown)=>unknown,reject:(error:unknown)=>unknown)=> (failProject && table==="project_members"?Promise.reject(new Error("Lookup failed")):Promise.resolve({data:rows})).then(resolve,reject)};
    return query;
  });
  return {client:{from} as unknown as SupabaseClient,inserts};
}
const input={type:"report_submitted",title:"Report submitted",target_type:"report",target_id:"report-a"};
it.each([false,true])("falls back only to company reviewers when project lookup fails or has no managers (%s)",async fail => {
  const f=fixture([],fail);await notifyProjectReportReviewers(f.client,"tenant-a","project-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["owner","admin"]);
});
it("keeps explicitly assigned active project managers and excludes inactive members",async () => {
  const f=fixture([{user_id:"assigned-manager",role:"manager",status:"active"},{user_id:"old-manager",role:"manager",status:"removed"},{user_id:"field-worker",role:"worker",status:"active"}]);
  await notifyProjectReportReviewers(f.client,"tenant-a","project-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["assigned-manager"]);
});
it("retains generic fallback member recipients for non-report consumers",async () => {
  const f=fixture();await notifyProjectManagers(f.client,"tenant-a","project-a",{...input,type:"issue_created"});
  expect(f.inserts.map(r=>r.user_id)).toEqual(["owner","admin","worker"]);
});
it("notifies a canonical tenant owner without an owner membership",async () => {
  const f=fixture([],false,true);await notifyTenantReportReviewers(f.client,"tenant-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["legacy-owner"]);
});
it("unscoped report fallback excludes ordinary workers and stakeholders",async () => {
  const f=fixture();await notifyTenantReportReviewers(f.client,"tenant-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["owner","admin"]);
});
