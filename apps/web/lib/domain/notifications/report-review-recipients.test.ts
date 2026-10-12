import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyProjectManagers, notifyTenantReportReviewers } from "./manager-notifications.repository";
function fixture(project: {user_id:string;role:string;status:string}[] = [], failProject=false) {
  const inserts: {user_id:string}[]=[];
  const tenant=[{user_id:"owner",role:"owner"},{user_id:"admin",role:"admin"},{user_id:"worker",role:"member"},{user_id:"customer",role:"stakeholder"}];
  const from=vi.fn((table:string) => {
    if(table==="manager_notifications") return {insert:vi.fn(async (rows:{user_id:string}[]) => {inserts.push(...rows);return {error:null};})};
    let rows: Record<string,string>[] = table==="project_members"?project:tenant;
    const query={select:()=>query,eq:(key:string,value:string)=>{if(key==="status")rows=rows.filter(r=>r[key]===value);return query;},
      in:(key:string,values:string[])=>{rows=rows.filter(r=>values.includes(r[key]));return query;},
      then:(resolve:(result:unknown)=>unknown,reject:(error:unknown)=>unknown)=> (failProject && table==="project_members"?Promise.reject(new Error("Lookup failed")):Promise.resolve({data:rows})).then(resolve,reject)};
    return query;
  });
  return {client:{from} as unknown as SupabaseClient,inserts};
}
const input={type:"report_submitted",title:"Report submitted",target_type:"report",target_id:"report-a"};
it.each([false,true])("falls back only to company reviewers when project lookup fails or has no managers (%s)",async fail => {
  const f=fixture([],fail);await notifyProjectManagers(f.client,"tenant-a","project-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["owner","admin"]);
});
it("keeps explicitly assigned active project managers and excludes inactive members",async () => {
  const f=fixture([{user_id:"assigned-manager",role:"manager",status:"active"},{user_id:"old-manager",role:"manager",status:"removed"},{user_id:"field-worker",role:"worker",status:"active"}]);
  await notifyProjectManagers(f.client,"tenant-a","project-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["assigned-manager"]);
});
it("unscoped report fallback excludes ordinary workers and stakeholders",async () => {
  const f=fixture();await notifyTenantReportReviewers(f.client,"tenant-a",input);
  expect(f.inserts.map(r=>r.user_id)).toEqual(["owner","admin"]);
});
