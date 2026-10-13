import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const repo=process.argv[2];assert(repo);const root=repo+'/apps/web/supabase/migrations/';
const nativeUrl=process.env.EVIDENCE_NATIVE_DATABASE_URL;
let nativeClient, NativeClient;
let db;
if(nativeUrl){
  const url=new URL(nativeUrl);
  assert(['localhost','127.0.0.1'].includes(url.hostname),'Native checks require an isolated local database');
  ({Client:NativeClient}=await import('pg'));
  nativeClient=new NativeClient({connectionString:nativeUrl});
  assert(['localhost','127.0.0.1','/var/run/postgresql'].includes(nativeClient.connectionParameters.host),'Native connection must remain local');
  await nativeClient.connect();
  assert.equal((await nativeClient.query("select count(*)::int as n from pg_tables where schemaname in ('public','auth','app_private')")).rows[0].n,0,'Use an empty isolated database');
  db={exec:sql=>nativeClient.query(sql),query:(sql,args)=>nativeClient.query(sql,args),close:()=>nativeClient.end()};
}else{db=new PGlite()}
const pass=[];const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const q=(s,p=[])=>db.query(s,p);
const test=async(n,fn)=>{await fn();pass.push(n);console.log('PASS',n)};
const as=async(user,fn,role='authenticated')=>{await db.exec('set role '+role);await q("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)",[user?id(user):'',role]);try{return await fn()}finally{await db.exec('reset role')}};
const denied=async(s,p,code)=>{let e;try{await q(s,p)}catch(x){e=x}assert(e,'Expected denial');assert.equal(e.code,code)};
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema app_private;grant usage on schema public,auth,app_private to anon,authenticated,service_role;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
create table accounts(id uuid primary key,status text);
create table tenants(id uuid primary key,user_id uuid,account_id uuid);
create table projects(id uuid primary key,tenant_id uuid);
create table tenant_members(tenant_id uuid,user_id uuid,role text);
create table project_members(tenant_id uuid,project_id uuid,user_id uuid,role text,status text default 'active' check(status in ('active','inactive','removed')),primary key(tenant_id,project_id,user_id));
create table media(id uuid primary key,tenant_id uuid,project_id uuid);
create table worker_tasks(id uuid primary key,tenant_id uuid,project_id uuid);
create table worker_day(id uuid primary key,tenant_id uuid);
create table worker_reports(id uuid primary key,tenant_id uuid,task_id uuid references worker_tasks(id) on delete set null,day_id uuid references worker_day(id) on delete set null,user_id uuid,status text);
create table upload_sessions(id uuid primary key);
create table worker_report_media(report_id uuid,media_id uuid,upload_session_id uuid);

`);
function helper(file,name){const s=readFileSync(root+file,'utf8');const start=s.indexOf('create or replace function public.'+name+'(');assert(start>=0);const end=s.indexOf('$$;',s.indexOf('as $$',start));assert(end>start);return s.slice(start,end+3)}
for(const [file,name] of [['20260329140000_stakeholder_rls_isolation.sql','is_internal_tenant_reader_for_tenant'],['20260906104000_project_write_authorization_hardening.sql','is_internal_tenant_writer_for_tenant']])await db.exec(helper(file,name));
await db.exec(helper('20260620140442_rbac_stage1_security_hardening.sql','can_manage_project_membership'));
await db.exec(helper('20261003170000_customer_intake_drafts.sql','customer_intake_tenant_account_active').replace('function public.customer_intake','function app_private.customer_intake'));
await db.exec('grant execute on all functions in schema app_private to authenticated,service_role');
await q("insert into accounts values($1,'active'),($2,'active')",[id(101),id(102)]);
await q('insert into tenants values($1,$2,$3),($4,$5,$6)',[id(201),id(1),id(101),id(202),id(2),id(102)]);
for(const [p,t] of [[301,201],[302,202],[303,201]])await q('insert into projects values($1,$2)',[id(p),id(t)]);
for(const [u,r] of [[3,'stakeholder'],[4,'viewer'],[5,'member'],[6,'admin'],[7,'member']])await q('insert into tenant_members values($1,$2,$3)',[id(201),id(u),r]);
await q("insert into project_members(tenant_id,project_id,user_id,role) values($1,$2,$3,'manager')",[id(201),id(301),id(5)]);
for(const [m,t,p] of [[401,201,301],[402,201,303],[403,202,302]])await q('insert into media values($1,$2,$3)',[id(m),id(t),id(p)]);
for(const [task,p] of [[501,301],[502,303]])await q('insert into worker_tasks values($1,$2,$3)',[id(task),id(201),id(p)]);
for(const [report,task,user] of [[601,501,7],[602,502,7],[603,501,6]])await q("insert into worker_reports values($1,$2,$3,null,$4,'submitted')",[id(report),id(201),id(task),id(user)]);
await q('insert into worker_report_media values($1,$2,null),($3,$4,null)',[id(601),id(401),id(602),id(402)]);
const sql=readFileSync(root+'20261011144945_harden_published_evidence_source_guard.sql','utf8');await db.exec(sql);await db.exec(sql);

const insert=(n,{p=301,r=601,m=401,u=7,visible=false,verified=false}={})=>q('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id,owner_visible,manager_verified) values($1,$2,$3,$4,$5,$6,$7,$8)',[id(n),id(201),id(p),r?id(r):null,m?id(m):null,id(u),visible,verified]);
await test('worker own source accepted and self-publication stripped',()=>as(7,async()=>{await insert(801,{visible:true,verified:true});const r=(await q('select owner_visible,manager_verified from visual_evidence_records where id=$1',[id(801)])).rows[0];assert.equal(r.owner_visible,false);assert.equal(r.manager_verified,false)}));
await test('worker cannot attribute another uploader',()=>as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id) values($1,$2,$3,$4,$5,$6)',[id(802),id(201),id(301),id(601),id(401),id(6)],'23514')));
await test('worker cannot create another reporters evidence',()=>as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,uploader_user_id) values($1,$2,$3,$4,$5)',[id(802),id(201),id(301),id(603),id(7)],'23514')));
for(const [name,p,r,m] of [['foreign media',301,601,403],['same-tenant different-project media',301,601,402],['different-project report',301,602,401],['unresolved report',301,999,401]])await test(name+' denied',()=>as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id) values($1,$2,$3,$4,$5,$6)',[id(802),id(201),id(p),id(r),id(m),id(7)],'23514')));
await test('unlinked media denied',async()=>{await q('insert into media values($1,$2,$3)',[id(404),id(201),id(301)]);await as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id) values($1,$2,$3,$4,$5,$6)',[id(802),id(201),id(301),id(601),id(404),id(7)],'23514'))});
await test('foreign task binding denied',()=>as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id,task_id) values($1,$2,$3,$4,$5,$6,$7)',[id(802),id(201),id(301),id(601),id(401),id(7),id(502)],'23514')));
await test('same-project different-report task binding denied',async()=>{await q('insert into worker_tasks values($1,$2,$3)',[id(503),id(201),id(301)]);await as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id,task_id) values($1,$2,$3,$4,$5,$6,$7)',[id(802),id(201),id(301),id(601),id(401),id(7),id(503)],'23514'))});
await test('media/upload pair from different report attachments denied',async()=>{await q('insert into upload_sessions values($1),($2)',[id(901),id(902)]);await q('insert into worker_report_media values($1,$2,$3),($1,$4,$5)',[id(601),id(401),id(901),id(404),id(902)]);await as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,upload_session_id,uploader_user_id) values($1,$2,$3,$4,$5,$6,$7)',[id(802),id(201),id(301),id(601),id(401),id(902),id(7)],'23514'))});
await test('current day-project fallback is accepted',async()=>{await db.exec('alter table worker_day add project_id uuid');await q('insert into worker_day values($1,$2,$3)',[id(701),id(201),id(301)]);await q("insert into worker_reports values($1,$2,null,$3,$4,'submitted')",[id(604),id(201),id(701),id(7)]);await q('insert into worker_report_media values($1,$2,null)',[id(604),id(401)]);await as(7,()=>insert(806,{r:604}));await as(null,()=>q('delete from visual_evidence_records where id=$1',[id(806)]),'service_role')});
await test('unscoped day-only report fails closed',async()=>{await q('insert into worker_day values($1,$2,null)',[id(702),id(201)]);await q("insert into worker_reports values($1,$2,null,$3,$4,'submitted')",[id(605),id(201),id(702),id(7)]);await q('insert into worker_report_media values($1,$2,null)',[id(605),id(401)]);await as(7,()=>denied('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id) values($1,$2,$3,$4,$5,$6)',[id(802),id(201),id(301),id(605),id(401),id(7)],'23514'))});
await test('manager cannot publish submitted report',()=>as(5,()=>denied('update visual_evidence_records set owner_visible=true,manager_verified=true where id=$1',[id(801)],'23514')));
await test('unreviewed caption can be corrected by author',()=>as(7,()=>q("update visual_evidence_records set zone_label='Kitchen' where id=$1",[id(801)])));
await q("update worker_reports set status='changes_requested' where id=$1",[id(601)]);
for(const [column,value] of [['task_id',id(502)],['task_id',id(503)],['task_id',null],['day_id',id(701)],['user_id',id(6)],['tenant_id',id(202)]])await test('report with evidence cannot rebind '+column+' to '+value,()=>as(7,()=>denied('update worker_reports set '+column+'=$1 where id=$2',[value,id(601)],'23514')));
await test('report without evidence may change tasks on resubmit',()=>as(7,()=>q('update worker_reports set task_id=$1 where id=$2',[id(503),id(603)])));
await test('task parent cleanup archives report evidence without blocking FK',async()=>{await q('insert into worker_tasks values($1,$2,$3)',[id(504),id(201),id(301)]);await q("insert into worker_reports values($1,$2,$3,null,$4,'submitted')",[id(606),id(201),id(504),id(7)]);await q('insert into worker_report_media values($1,$2,null)',[id(606),id(401)]);await as(7,()=>insert(807,{r:606}));await q('delete from worker_tasks where id=$1',[id(504)]);const row=(await q('select * from visual_evidence_records where id=$1',[id(807)])).rows[0];assert.equal(row.report_id,null);assert.equal(row.owner_visible,false);assert.equal(row.retention_state,'archived');await q('delete from visual_evidence_records where id=$1',[id(807)])});
await q("update worker_reports set status='approved' where id=$1",[id(601)]);
await test('approved report closes source edit race before publication',()=>as(7,()=>denied("update visual_evidence_records set zone_label='Injected' where id=$1",[id(801)],'23514')));
await test('cannot add source after approval',()=>as(7,async()=>{try{await insert(802);assert.fail('Expected denial')}catch(e){assert.equal(e.code,'23514')}}));
await test('revoked project manager cannot lock or publish another authors source',async()=>{await q("update project_members set status='removed' where user_id=$1",[id(5)]);await as(5,()=>denied('update visual_evidence_records set owner_visible=true,manager_verified=true where id=$1',[id(801)],'42501'));await as(5,()=>denied('select app_private.lock_evidence_report($1,$2)',[id(201),id(601)],'42501'));await q("update project_members set status='active' where user_id=$1",[id(5)])});
await test('current member/project-manager can publish reviewed source',()=>as(5,async()=>{await q('update visual_evidence_records set owner_visible=true,manager_verified=true where id=$1',[id(801)]);assert.equal((await q('select owner_visible from visual_evidence_records where id=$1',[id(801)])).rows[0].owner_visible,true)}));
for(const user of [7,5,6])await test('reviewed provenance/content immutable for '+user,()=>as(user,()=>denied("update visual_evidence_records set provenance='{\"actual_amount\":9}' where id=$1",[id(801)],'23514')));
for(const [key,value] of [['id',id(899)],['tenant_id',id(202)],['project_id',id(303)],['report_id',id(602)],['media_id',id(402)],['upload_session_id',id(900)],['uploader_user_id',id(6)]])await test('immutable '+key,()=>as(5,()=>denied('update visual_evidence_records set '+key+'=$1 where id=$2',[value,id(801)],'23514')));
await test('non-manager cannot change visibility',()=>as(7,()=>denied('update visual_evidence_records set owner_visible=false where id=$1',[id(801)],'42501')));
await test('manager may withdraw publication without mutating reviewed source',()=>as(5,()=>q('update visual_evidence_records set owner_visible=false,manager_verified=false where id=$1',[id(801)])));
await test('implicit tenant owner can read despite absent member row',()=>as(1,async()=>assert.equal((await q('select id from visual_evidence_records')).rows.length,1)));
await test('implicit tenant owner can review metadata',()=>as(1,()=>q('update visual_evidence_records set owner_visible=true,manager_verified=true where id=$1',[id(801)])));
for(const user of [2,3])await test('raw evidence denied for '+user,()=>as(user,async()=>assert.equal((await q('select * from visual_evidence_records')).rows.length,0)));
await test('viewer reads but cannot insert',()=>as(4,async()=>{assert.equal((await q('select id from visual_evidence_records')).rows.length,1);try{await insert(802);assert.fail('Expected denial')}catch(e){assert.equal(e.code,'42501')}}));
await test('suspended account hides evidence and denies edits',async()=>{await q("update accounts set status='suspended' where id=$1",[id(101)]);await as(1,async()=>{assert.equal((await q('select * from visual_evidence_records')).rows.length,0);try{await insert(802);assert.fail('Expected denial')}catch(e){assert.equal(e.code,'42501')}});await q("update accounts set status='active' where id=$1",[id(101)])});
await test('service trusted writes preserve consistency checks',()=>as(null,async()=>{await insert(802,{visible:true,verified:true});await denied('update visual_evidence_records set media_id=$1 where id=$2',[id(403),id(802)],'23514')},'service_role'));


await test('manual manager capture cannot impersonate another uploader',()=>as(5,async()=>{try{await insert(804,{r:null,m:404,u:7});assert.fail('Expected denial')}catch(e){assert.equal(e.code,'42501')}}));
await test('manual manager capture uses the actual caller',()=>as(5,()=>insert(804,{r:null,m:404,u:5})));
await test('authenticated draft report cleanup archives its evidence',()=>as(7,async()=>{await insert(805,{p:303,r:602,m:402});await q('delete from worker_reports where id=$1',[id(602)]);const r=(await q('select * from visual_evidence_records where id=$1',[id(805)])).rows[0];assert.equal(r.report_id,null);assert.equal(r.retention_state,'archived');assert.equal(r.owner_visible,false)}));
await test('FK report unlink withdraws publication and preserves private provenance',()=>as(null,async()=>{await q('delete from worker_reports where id=$1',[id(601)]);const r=(await q('select * from visual_evidence_records where id=$1',[id(801)])).rows[0];assert.equal(r.report_id,null);assert.equal(r.owner_visible,false);assert.equal(r.manager_verified,false);assert.equal(r.retention_state,'archived');assert.equal(r.provenance.removed_source.report_id,id(601))},'service_role'));
await test('FK last-media unlink archives without blocking cleanup',()=>as(null,async()=>{await q('delete from media where id=$1',[id(401)]);const r=(await q('select * from visual_evidence_records where id=$1',[id(801)])).rows[0];assert.equal(r.media_id,null);assert.equal(r.retention_state,'archived');assert.equal(r.provenance.removed_source.report_id,id(601));assert.equal(r.provenance.removed_source.media_id,id(401))},'service_role'));
if(nativeClient){
  const {verifyEvidenceApprovalRaces}=await import('file://'+repo+'/scripts/ops/verify_evidence_approval_races.mjs');
  const writer=new NativeClient({connectionString:nativeUrl}),reviewer=new NativeClient({connectionString:nativeUrl});
  await writer.connect();await reviewer.connect();
  try{await verifyEvidenceApprovalRaces({writer,reviewer,observer:nativeClient,id})}finally{await writer.end();await reviewer.end()}
}
await db.close();console.log(pass.length+' published evidence SQL contracts PASS');
