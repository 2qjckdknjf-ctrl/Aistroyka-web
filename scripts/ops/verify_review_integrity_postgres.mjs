// Real PostgreSQL semantics in isolated PGlite or a fresh LOCAL PostgreSQL database.
// Native mode also checks two-session review races; never use hosted credentials.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const repo = process.argv[2];
assert(repo, 'Pass the absolute repository path');
const root = `${repo}/apps/web/supabase/migrations/`;
const nativeUrl = process.env.REVIEW_NATIVE_DATABASE_URL;
let nativeClient, NativeClient, db;
if (nativeUrl) {
  const url = new URL(nativeUrl);
  assert(['localhost', '127.0.0.1'].includes(url.hostname), 'Native checks require an isolated local database');
  ({ Client: NativeClient } = await import('pg'));
  nativeClient = new NativeClient({ connectionString: nativeUrl });
  assert(['localhost', '127.0.0.1', '/var/run/postgresql'].includes(nativeClient.connectionParameters.host), 'Native connection must remain local');
  await nativeClient.connect();
  assert.equal((await nativeClient.query("select count(*)::int as n from pg_tables where schemaname in ('public','auth','app_private')")).rows[0].n, 0, 'Use an empty isolated database');
  db = { exec: sql => nativeClient.query(sql), query: (sql,args) => nativeClient.query(sql,args), close: () => nativeClient.end() };
} else {
  db = new PGlite();
}
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const q = (s, p = []) => db.query(s, p);
const failures = [];
let passed = 0;
async function test(name, fn) {
  await db.exec('begin');
  try { await fn(); passed++; console.log('PASS', name); }
  catch (e) { failures.push(name); console.error('FAIL', name, e.message); }
  finally { await db.exec('rollback'); }
}
async function as(role, user, fn) {
  await db.exec(`set local role ${role}`);
  await q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)", [user ? id(user) : '', role]);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function denied(fn, codes = ['42501']) {
  await db.exec('savepoint expected_denial');
  let error;
  try { await fn(); } catch (e) { error = e; }
  await db.exec('rollback to savepoint expected_denial');
  await db.exec('release savepoint expected_denial');
  assert(error, 'write unexpectedly succeeded');
  assert(codes.includes(error.code), `unexpected SQLSTATE ${error.code}: ${error.message}`);
}
function helper(file, name) {
  const s = readFileSync(root + file, 'utf8');
  const start = s.indexOf(`create or replace function public.${name}(`);
  assert(start >= 0, name);
  return s.slice(start, s.indexOf('$$;', s.indexOf('as $$', start)) + 3);
}
await db.exec(`
do $$begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end$$;
create schema auth; create schema app_private;
grant usage on schema auth,public to anon,authenticated,service_role;
grant usage on schema app_private to authenticated,service_role;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
alter default privileges in schema public grant all on tables to authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
create table auth.users(id uuid primary key);
create table public.accounts(id uuid primary key,status text);
create table public.tenants(id uuid primary key,user_id uuid,account_id uuid);
create table public.projects(id uuid primary key,tenant_id uuid);
create table public.tenant_members(tenant_id uuid,user_id uuid,role text);
create table public.media(id uuid primary key,tenant_id uuid,project_id uuid);
create table public.customer_intake_drafts(id uuid primary key,tenant_id uuid,project_id uuid);
create table public.ai_analysis(id uuid primary key default gen_random_uuid(),media_id uuid not null references media(id),
stage text,completion_percent integer not null default 0 check(completion_percent between 0 and 100),
risk_level text not null default 'low' check(risk_level in ('low','medium','high')),
detected_issues text[] not null default '{}',recommendations text[] not null default '{}',frame_count integer,
created_at timestamptz not null default now());
`);
for (const name of ['is_tenant_owner_or_admin','project_belongs_to_tenant']) {
  await db.exec(helper('20260906092000_harden_viewer_project_jobs_estimate_writes.sql', name));
}
await db.exec(helper('20260906104000_project_write_authorization_hardening.sql','is_internal_tenant_writer_for_tenant'));
await db.exec(helper('20261003170000_customer_intake_drafts.sql','customer_intake_tenant_account_active'));
await db.exec(`alter function public.customer_intake_tenant_account_active(uuid) set schema app_private;
revoke all on function app_private.customer_intake_tenant_account_active(uuid) from public,anon;
grant execute on function app_private.customer_intake_tenant_account_active(uuid) to authenticated,service_role;`);
await q("insert into accounts values($1,'active'),($2,'active')",[id(101),id(102)]);
for (let n = 1; n <= 6; n++) await q('insert into auth.users values($1)', [id(n)]);
await q('insert into tenants values($1,$2,$3),($4,$5,$6)', [id(201),id(1),id(101),id(202),id(2),id(102)]);
await q('insert into projects values($1,$2),($3,$4),($5,$2)', [id(301),id(201),id(302),id(202),id(303)]);
for (const [user, role] of [[3,'stakeholder'],[4,'viewer'],[5,'member'],[6,'admin']]) {
  await q('insert into tenant_members values($1,$2,$3)',[id(201),id(user),role]);
}
await q('insert into media values($1,$2,$3),($4,$5,$6)',[id(401),id(201),id(301),id(402),id(202),id(302)]);
await q('insert into customer_intake_drafts values($1,$2,$3),($4,$5,$6),($7,$2,$8)',[id(701),id(201),id(301),id(702),id(202),id(302),id(703),id(303)]);
await q("insert into ai_analysis(id,media_id,stage,completion_percent) values($1,$2,'original',20)",[id(501),id(401)]);

const prerequisite = '20261028130000_ai_analysis_tenant_binding.sql';
if (existsSync(root + prerequisite)) {
  await db.exec(readFileSync(root + prerequisite,'utf8'));
  await db.exec(readFileSync(root + prerequisite,'utf8'));
  passed++; console.log('PASS review migration tenant prerequisite is idempotent');
} else {
  // The old chain cannot create its human-review index. Keep the remaining
  // baseline probes independent by supplying the missing fixture column.
  try { await db.exec(readFileSync(root + '20261028140000_ai_analysis_human_review.sql','utf8')); }
  catch (e) { assert.equal(e.code,'42703'); failures.push('fresh migration chain has tenant prerequisite'); console.error('FAIL fresh migration chain: missing tenant_id'); }
  await db.exec('alter table ai_analysis add column tenant_id uuid');
  await q('update ai_analysis set tenant_id=$1',[id(201)]);
}
for (const file of [
  '20261028140000_ai_analysis_human_review.sql',
  '20261028160000_stage2a_a01_quantity_storage.sql',
  '20261028170000_preproject_extraction_observations.sql',
  '20261028180000_stage2a_a04_quantity_acceptance.sql',
  '20261028210000_ais_correction_009_analysis_corrections.sql',
  '20261030220000_ais_rule_015_completeness_evaluations.sql',
  '20261030240000_ais_recon_017_finding_ledger.sql',
]) await db.exec(readFileSync(root + file,'utf8'));
const fix = '20261127150000_harden_internal_review_integrity.sql';
if (existsSync(root + fix)) {
  await db.exec(readFileSync(root + fix,'utf8'));
  await db.exec(readFileSync(root + fix,'utf8'));
}
const atomic = '20261127151000_review_ai_analysis_atomic.sql';
if (existsSync(root + atomic)) {
  await db.exec(readFileSync(root + atomic,'utf8'));
  await db.exec(readFileSync(root + atomic,'utf8'));
}
for (const [spec, snapshot, calculation, tenant, project, owner] of [[801,811,821,201,301,1],[802,812,822,202,302,2],[803,813,823,201,303,1]]) {
  await q("insert into quantity_work_specifications(id,tenant_id,project_id,work_code,rule_version,unit,quantity_basis,rule_id,title,revision,created_by) values($1,$2,$3,'wall','v1','m2','area','area','Wall',1,$4)",[id(spec),id(tenant),id(project),id(owner)]);
  await q("insert into quantity_input_snapshots(id,tenant_id,project_id,work_specification_id,work_code,rule_version,quantity_kind,request_kind,request_payload,request_hash,created_by) values($1,$2,$3,$4,'wall','v1','area','area','{}',$5,$6)",[id(snapshot),id(tenant),id(project),id(spec),String(snapshot).padStart(64,'a'),id(owner)]);
  await q("insert into quantity_calculation_revisions(id,tenant_id,project_id,input_snapshot_id,revision,result_payload,rule_version,created_by) values($1,$2,$3,$4,1,'{}','v1',$5)",[id(calculation),id(tenant),id(project),id(snapshot),id(owner)]);
}
await q("insert into preproject_extraction_runs(id,tenant_id,project_id,intake_draft_id,created_by) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)",[id(901),id(201),id(301),id(701),id(1),id(902),id(202),id(302),id(702),id(2)]);
await q("insert into preproject_observations(id,tenant_id,run_id,kind,label,payload) values($1,$2,$3,'note','Original','{\"source\":\"original\"}')",[id(911),id(201),id(901)]);
await q("insert into tender_reconciliation_findings(id,tenant_id,project_id,kind,title,summary,created_by) values($1,$2,$3,'quantity_mismatch','Original','Evidence',$4)",[id(921),id(201),id(301),id(1)]);

const accept = (project=301, calculation=821, actor=1) => q("insert into quantity_acceptance_decisions(tenant_id,project_id,calculation_revision_id,decision,decided_by) values($1,$2,$3,'accepted',$4)",[id(201),id(project),id(calculation),id(actor)]);
for (const user of [3,4,5]) await test(`role ${user} cannot accept quantities`,()=>as('authenticated',user,()=>denied(()=>accept(301,821,user))));
for (const user of [1,6]) await test(`manager ${user} retains acceptance`,()=>as('authenticated',user,()=>accept(301,821,user)));
await test('acceptance cannot spoof reviewer',()=>as('authenticated',1,()=>denied(()=>accept(301,821,2))));
await test('acceptance cannot bind foreign project',()=>as('authenticated',1,()=>denied(()=>accept(302,822))));
await test('acceptance cannot bind foreign calculation',()=>as('authenticated',1,()=>denied(()=>accept(301,822))));
await test('acceptance cannot bind another own project calculation',()=>as('authenticated',1,()=>denied(()=>accept(301,823))));
await test('work specification cannot bind foreign project',()=>as('authenticated',5,()=>denied(()=>q("insert into quantity_work_specifications(tenant_id,project_id,work_code,rule_version,unit,quantity_basis,rule_id,title,revision,created_by) values($1,$2,'new','v1','m2','area','area','New',1,$3)",[id(201),id(302),id(5)]))));
for (const spec of [802,803]) await test(`snapshot cannot bind wrong-scope spec ${spec}`,()=>as('authenticated',5,()=>denied(()=>q("insert into quantity_input_snapshots(tenant_id,project_id,work_specification_id,work_code,rule_version,quantity_kind,request_kind,request_payload,request_hash,created_by) values($1,$2,$3,'wall','v1','reported','area','{}',$4,$5)",[id(201),id(301),id(spec),'b'.repeat(64),id(5)]))));
for (const snapshot of [812,813]) await test(`calculation cannot bind wrong-scope snapshot ${snapshot}`,()=>as('authenticated',5,()=>denied(()=>q("insert into quantity_calculation_revisions(tenant_id,project_id,input_snapshot_id,revision,result_payload,rule_version,created_by) values($1,$2,$3,2,'{}','v1',$4)",[id(201),id(301),id(snapshot),id(5)]))));
await test('client cannot forge correction provenance',()=>as('authenticated',1,()=>denied(()=>q("insert into ai_analysis_corrections(tenant_id,analysis_id,verdict,original_snapshot,reviewer_user_id) values($1,$2,'accepted','{}',$3)",[id(201),id(501),id(2)]))));
for (const [project,draft] of [[302,702],[301,702],[301,703]]) await test(`preproject rejects project/draft scope ${project}/${draft}`,()=>as('authenticated',5,()=>denied(()=>q('insert into preproject_extraction_runs(tenant_id,project_id,intake_draft_id,created_by) values($1,$2,$3,$4)',[id(201),id(project),id(draft),id(5)]))));
for (const [column,value] of [['tenant_id',id(202)],['project_id',id(303)],['intake_draft_id',id(703)],['provider_meta','{"forged":true}']]) await test(`run identity ${column} is not client-writable`,()=>as('authenticated',1,()=>denied(()=>q(`update preproject_extraction_runs set ${column}=$1 where id=$2`,[value,id(901)]))));
for (const [column,value] of [['tenant_id',id(202)],['run_id',id(902)],['payload','{"forged":true}'],['source_coords','{"forged":true}']]) await test(`observation provenance ${column} is not client-writable`,()=>as('authenticated',1,()=>denied(()=>q(`update preproject_observations set ${column}=$1 where id=$2`,[value,id(911)]))));
await test('observation cannot bind foreign run',()=>as('authenticated',5,()=>denied(()=>q("insert into preproject_observations(tenant_id,run_id,kind,label) values($1,$2,'note','Forged')",[id(201),id(902)]))));
await test('observation cannot spoof reviewer',()=>as('authenticated',1,()=>denied(()=>q("update preproject_observations set review_status='accepted',reviewed_by=$1,reviewed_at=now() where id=$2",[id(2),id(911)]))));
await test('manager retains observation label review',()=>as('authenticated',6,()=>q("update preproject_observations set label='Edited',review_status='edited',reviewed_by=$1,reviewed_at=now(),updated_at=now() where id=$2 returning id",[id(6),id(911)]).then(r=>assert.equal(r.rows.length,1))));
await test('completeness cannot bind foreign project',()=>as('authenticated',5,()=>denied(()=>q("insert into construction_completeness_evaluations(tenant_id,project_id,template_id,template_version,trade,verdict,missing_required_count,missing_recommended_count,created_by) values($1,$2,'seed','v1','waterproofing','NEEDS_REVIEW',0,0,$3)",[id(201),id(302),id(5)]))));
await test('reconciliation cannot bind foreign project',()=>as('authenticated',5,()=>denied(()=>q("insert into tender_reconciliation_findings(tenant_id,project_id,kind,title,summary,created_by) values($1,$2,'quantity_mismatch','New','Evidence',$3)",[id(201),id(302),id(5)]))));
await test('reconciliation cannot rewrite provenance',()=>as('authenticated',1,()=>denied(()=>q("update tender_reconciliation_findings set project_id=$1,details_json='{\"forged\":true}' where id=$2",[id(303),id(921)]))));
for (const fn of ['enforce_quantity_work_specification_immutable','enforce_quantity_input_snapshot_immutable','enforce_quantity_calculation_revision_immutable','enforce_quantity_acceptance_decision_immutable']) {
  await test(`${fn} is not client RPC`,async()=>assert.equal((await q('select has_function_privilege($1,$2,$3) as allowed',['authenticated',`public.${fn}()`,'EXECUTE'])).rows[0].allowed,false));
}
await test('tenant bootstrap preserves existing source ownership',async()=>assert.equal((await q('select tenant_id from ai_analysis where id=$1',[id(501)])).rows[0].tenant_id,id(201)));
await test('legacy media-only analysis insert gains tenant',async()=>{
  const r=await q('insert into ai_analysis(media_id) values($1) returning tenant_id',[id(401)]);
  assert.equal(r.rows[0].tenant_id,id(201));
});
await test('analysis cannot claim foreign media tenant',()=>denied(()=>q('insert into ai_analysis(media_id,tenant_id) values($1,$2)',[id(401),id(202)]),['23514']));

const snapshot = (kind = 'reported', creator = 5) => q("insert into quantity_input_snapshots(tenant_id,project_id,work_specification_id,work_code,rule_version,quantity_kind,request_kind,request_payload,request_hash,created_by) values($1,$2,$3,'wall','v1',$4,'area','{}',$5,$6) returning id",[id(201),id(301),id(801),kind,'c'.repeat(64),id(creator)]);
for (const kind of ['reported','measured']) await test(`member retains ${kind} quantity capture`,()=>as('authenticated',5,()=>snapshot(kind)));
for (const kind of ['planned','accepted','system_complete']) await test(`member cannot forge ${kind} quantity capture`,()=>as('authenticated',5,()=>denied(()=>snapshot(kind))));
await test('manager retains planned quantity capture',()=>as('authenticated',6,()=>snapshot('planned',6)));
await test('quantity cannot spoof creator',()=>as('authenticated',5,()=>denied(()=>snapshot('reported',1))));
await test('member retains scoped specification and calculation writes',()=>as('authenticated',5,async()=>{
  await q("insert into quantity_work_specifications(tenant_id,project_id,work_code,rule_version,unit,quantity_basis,rule_id,title,revision,created_by) values($1,$2,'new','v1','m2','area','area','New',1,$3)",[id(201),id(301),id(5)]);
  await q("insert into quantity_calculation_revisions(tenant_id,project_id,input_snapshot_id,revision,result_payload,rule_version,created_by) values($1,$2,$3,2,'{}','v1',$4)",[id(201),id(301),id(811),id(5)]);
}));
await test('member retains scoped extraction and pending observation creation',()=>as('authenticated',5,async()=>{
  const run=(await q('insert into preproject_extraction_runs(tenant_id,project_id,intake_draft_id,created_by) values($1,$2,$3,$4) returning id',[id(201),id(301),id(701),id(5)])).rows[0];
  await q("insert into preproject_observations(tenant_id,run_id,kind,label) values($1,$2,'note','New')",[id(201),run.id]);
  const updated=await q("update preproject_extraction_runs set status='reviewed',updated_at=now() where id=$1 returning id",[run.id]);
  assert.equal(updated.rows.length,1);
}));
await test('new observation cannot forge already-reviewed evidence',()=>as('authenticated',5,()=>denied(()=>q("insert into preproject_observations(tenant_id,run_id,kind,label,review_status,reviewed_by,reviewed_at) values($1,$2,'note','Forged','accepted',$3,now())",[id(201),id(901),id(5)]))));
await test('member retains bound observation review under existing application policy',()=>as('authenticated',5,async()=>{
  const result=await q("update preproject_observations set review_status='accepted',reviewed_by=$1,reviewed_at=now() where id=$2 returning id",[id(5),id(911)]);
  assert.equal(result.rows.length,1);
}));
const finding = (actor=5) => q("insert into tender_reconciliation_findings(tenant_id,project_id,kind,title,summary,created_by) values($1,$2,'quantity_mismatch','New','Evidence',$3) returning id",[id(201),id(301),id(actor)]);
for (const status of ['accepted','rejected','superseded']) await test(`finding cannot be created already ${status}`,()=>as('authenticated',5,()=>denied(()=>q("insert into tender_reconciliation_findings(tenant_id,project_id,kind,title,summary,created_by,status,reviewed_by,reviewed_at) values($1,$2,'quantity_mismatch','Forged','Evidence',$3,$4,$5,now())",[id(201),id(301),id(5),status,id(1)]))));
await test('member retains scoped completeness and finding creation',()=>as('authenticated',5,async()=>{
  await q("insert into construction_completeness_evaluations(tenant_id,project_id,template_id,template_version,trade,verdict,missing_required_count,missing_recommended_count,created_by) values($1,$2,'seed','v1','waterproofing','NEEDS_REVIEW',0,0,$3)",[id(201),id(301),id(5)]);
  await finding();
}));
await test('finding review binds the actual reviewer',()=>as('authenticated',5,async()=>{
  await denied(()=>q("update tender_reconciliation_findings set status='accepted',reviewed_by=$1,reviewed_at=now() where id=$2",[id(1),id(921)]));
  const updated=await q("update tender_reconciliation_findings set status='accepted',reviewed_by=$1,reviewed_at=now() where id=$2 returning id",[id(5),id(921)]);
  assert.equal(updated.rows.length,1);
}));
for (const terminal of ['accepted','rejected']) await test(`final ${terminal} finding cannot be reopened or reviewed again`,async()=>{
  await q('update tender_reconciliation_findings set status=$1,reviewed_by=$2,reviewed_at=now() where id=$3',[terminal,id(6),id(921)]);
  await as('authenticated',5,async()=>{
    for (const status of ['open','needs_review','accepted','rejected']) {
      const changed=await q('update tender_reconciliation_findings set status=$1,reviewed_by=$2,reviewed_at=now() where id=$3 returning id',[status,id(5),id(921)]);
      assert.equal(changed.rows.length,0);
    }
  });
});
for (const corrupt of ['tenant','orphan']) await test(`tenant prerequisite fails without rewriting existing ${corrupt} source corruption`,async()=>{
  await db.exec('alter table ai_analysis disable trigger all');
  if(corrupt==='tenant') await q('update ai_analysis set tenant_id=$1 where id=$2',[id(202),id(501)]);
  else await q('update ai_analysis set media_id=$1 where id=$2',[id(999),id(501)]);
  await denied(()=>db.exec(readFileSync(root+prerequisite,'utf8')),['23514']);
  assert.equal((await q('select tenant_id from ai_analysis where id=$1',[id(501)])).rows[0].tenant_id,id(corrupt==='tenant'?202:201));
});
for (const status of ['suspended','closed']) await test(`${status} account cannot read or write finding ledger`,async()=>{
  await q('update accounts set status=$1 where id=$2',[status,id(101)]);
  await as('authenticated',5,async()=>{
    assert.equal((await q('select id from tender_reconciliation_findings')).rows.length,0);
    await denied(()=>finding());
    const changed=await q("update tender_reconciliation_findings set status='accepted',reviewed_by=$1,reviewed_at=now() where id=$2 returning id",[id(5),id(921)]);
    assert.equal(changed.rows.length,0);
  });
});

const rpcSql = 'select public.review_ai_analysis_atomic($1,$2,$3,$4,$5,$6::jsonb) as receipt';
const rpcArgs = (overrides = {}) => {
  const v={analysis:501,tenant:201,reviewer:1,status:'edited',note:' corrected ',payload:{stage:'corrected',completion_percent:80},...overrides};
  return [id(v.analysis),id(v.tenant),id(v.reviewer),v.status,v.note,v.payload === null ? null : JSON.stringify(v.payload)];
};
const rpc = (overrides = {}) => q(rpcSql,rpcArgs(overrides));
const readAnalysis = async(analysis=501)=>(await q('select * from ai_analysis where id=$1',[id(analysis)])).rows[0];
const readCorrections = async(analysis=501)=>(await q('select * from ai_analysis_corrections where analysis_id=$1 order by created_at',[id(analysis)])).rows;
for (const role of ['anon','authenticated']) await test(`${role} cannot invoke service-only atomic review`,()=>as(role,1,()=>denied(()=>rpc())));
await test('service client still must carry its service role claim',()=>denied(()=>rpc()));
for (const reviewer of [2,3,4]) await test(`atomic review rejects unauthorized actor ${reviewer}`,()=>as('service_role',null,()=>denied(()=>rpc({reviewer}))));
for (const reviewer of [1,5,6]) await test(`atomic review preserves internal review access for ${reviewer}`,()=>as('service_role',null,async()=>{
  const receipt=(await rpc({reviewer,status:'accepted',payload:null})).rows[0].receipt;
  assert.equal(receipt.reviewed_by,id(reviewer));
  assert.equal(receipt.review_status,'accepted');
  assert(receipt.correction_id);
}));
await test('atomic review does not cross tenant or reveal a foreign analysis',()=>as('service_role',null,()=>denied(()=>rpc({tenant:202,reviewer:2}),['P0002'])));
await test('atomic review rejects missing analysis',()=>as('service_role',null,()=>denied(()=>rpc({analysis:999}),['P0002'])));
for (const payload of [null,[],42]) await test(`edited review rejects non-object payload ${JSON.stringify(payload)}`,()=>as('service_role',null,()=>denied(()=>rpc({payload}),['22023'])));
await test('atomic review rejects pending verdict',()=>as('service_role',null,()=>denied(()=>rpc({status:'pending'}),['22023'])));
await test('atomic review enforces the existing account suspension boundary',async()=>{
  await q("update accounts set status='suspended' where id=$1",[id(101)]);
  await as('service_role',null,()=>denied(()=>rpc()));
  assert.equal((await readAnalysis()).review_status,'pending');
  assert.equal((await readCorrections()).length,0);
});
await test('edited verdict and immutable original snapshot commit together',async()=>{
  const receipt=await as('service_role',null,async()=>(await rpc({payload:{stage:'s'.repeat(220),completion_percent:999,risk_level:'high',detected_issues:['issue',2],recommendations:Array(70).fill('fix'),tenant_id:id(202),margin:99}})).rows[0].receipt);
  const analysis=await readAnalysis(), history=await readCorrections();
  assert.equal(analysis.stage,'s'.repeat(200));
  assert.equal(analysis.completion_percent,100);
  assert.equal(analysis.tenant_id,id(201));
  assert.equal(history.length,1);
  assert.equal(receipt.correction_id,history[0].id);
  assert.equal(history[0].original_snapshot.stage,'original');
  assert.equal(history[0].original_snapshot.completion_percent,20);
  assert.deepEqual(history[0].corrected_payload.detected_issues,['issue']);
  assert.equal(history[0].corrected_payload.recommendations.length,64);
  assert.equal(history[0].corrected_payload.margin,undefined);
  assert.equal(history[0].reason,'corrected');
  assert.equal(new Date(history[0].created_at).getTime(),new Date(analysis.reviewed_at).getTime());
});
await test('a second correction snapshots the preceding committed prediction',async()=>{
  await as('service_role',null,()=>rpc({payload:{completion_percent:30}}));
  await as('service_role',null,()=>rpc({reviewer:6,payload:{completion_percent:40}}));
  const history=await readCorrections();
  assert.deepEqual(history.map(x=>x.original_snapshot.completion_percent),[20,30]);
  assert.deepEqual(history.map(x=>x.corrected_payload.completion_percent),[30,40]);
  assert.equal((await readAnalysis()).completion_percent,40);
});
for (const verdict of ['accepted','rejected','insufficient_evidence']) await test(`${verdict} preserves prediction and records its exact snapshot`,async()=>{
  await as('service_role',null,()=>rpc({status:verdict,payload:{completion_percent:80}}));
  const analysis=await readAnalysis(), history=await readCorrections();
  assert.equal(analysis.review_status,verdict);
  assert.equal(analysis.completion_percent,20);
  assert.equal(history[0].corrected_payload,null);
  assert.equal(history[0].original_snapshot.completion_percent,20);
});
for (const [name,table,behavior] of [
  ['correction insert raises','ai_analysis_corrections',"raise exception 'fixture unavailable';"],
  ['correction insert silently returns null','ai_analysis_corrections','return null;'],
  ['analysis update silently returns null','ai_analysis','return null;'],
]) await test(`${name}: transaction retains original verdict and prediction`,async()=>{
  await db.exec(`create function public.fixture_review_failure() returns trigger language plpgsql as $$begin ${behavior} end$$;
    create trigger fixture_review_failure before ${table==='ai_analysis'?'update':'insert'} on public.${table} for each row execute function public.fixture_review_failure();`);
  await as('service_role',null,()=>denied(()=>rpc(),['P0001']));
  const analysis=await readAnalysis();
  assert.equal(analysis.stage,'original');
  assert.equal(analysis.completion_percent,20);
  assert.equal(analysis.review_status,'pending');
  assert.equal(analysis.reviewed_by,null);
  assert.equal((await readCorrections()).length,0);
});
await test('invalid prediction constraint rolls back review and history',async()=>{
  await as('service_role',null,()=>denied(()=>rpc({payload:{risk_level:'invalid'}}),['23514']));
  assert.equal((await readAnalysis()).review_status,'pending');
  assert.equal((await readCorrections()).length,0);
});

if (nativeClient && failures.length===0) {
  const first=new NativeClient({connectionString:nativeUrl}), second=new NativeClient({connectionString:nativeUrl});
  await first.connect(); await second.connect();
  const secondPid=(await second.query('select pg_backend_pid() as pid')).rows[0].pid;
  const beginService=async(client)=>{
    await client.query('begin');
    await client.query('set local statement_timeout=10000');
    await client.query('set local role service_role');
    await client.query("select set_config('request.jwt.claim.role','service_role',true)");
  };
  const waitLocked=async()=>{
    const end=Date.now()+5000;
    while(Date.now()<end) {
      const state=(await q('select wait_event_type from pg_stat_activity where pid=$1',[secondPid])).rows[0];
      if(state?.wait_event_type==='Lock') return;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.fail('Second review must wait for the first analysis row lock');
  };
  try {
    for (const commitFirst of [true,false]) {
      const analysis=commitFirst ? 502 : 503;
      await q("insert into ai_analysis(id,media_id,stage,completion_percent) values($1,$2,'original',20)",[id(analysis),id(401)]);
      await beginService(first);
      await first.query(rpcSql,rpcArgs({analysis,payload:{completion_percent:30}}));
      await beginService(second);
      const pending=second.query(rpcSql,rpcArgs({analysis,reviewer:6,payload:{completion_percent:40}})).then(value=>({value}),error=>({error}));
      await waitLocked();
      await first.query(commitFirst?'commit':'rollback');
      const outcome=await pending;
      if(outcome.error) throw outcome.error;
      await second.query('commit');
      const history=await readCorrections(analysis);
      assert.deepEqual(history.map(x=>x.original_snapshot.completion_percent),commitFirst?[20,30]:[20]);
      assert.equal((await readAnalysis(analysis)).completion_percent,40);
      if(commitFirst) assert(new Date(history[1].created_at)>=new Date(history[0].created_at));
      passed++; console.log(`PASS native concurrent review after first ${commitFirst?'commit':'rollback'} has exact original history`);
    }
  } finally {
    await first.query('rollback'); await second.query('rollback');
    await first.end(); await second.end();
  }
}
await db.close();
console.log(JSON.stringify({passed,failed:failures.length,failures,nativeConcurrency:!!nativeClient}));
if(failures.length) process.exitCode=1;


