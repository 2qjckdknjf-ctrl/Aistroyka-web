import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = process.argv[2] + '/apps/web/supabase/migrations/';
assert(process.argv[2], 'Pass the absolute repository path');
const db=new PGlite(); const passed=[];
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const test=async(name,fn)=>{await fn();passed.push(name);console.log('PASS',name)};
const query=(s,p=[])=>db.query(s,p);
const denied=async(s,p,code)=>{try{await query(s,p);assert.fail('Expected denial')}catch(e){assert(Array.isArray(code)?code.includes(e.code):e.code===code,`Expected ${code}, received ${e.code}: ${e.message}`);if(Array.isArray(code))assert.match(e.message,/location is invalid|violates check constraint/)}};
const as=async(role,user,fn)=>{await db.exec(`set role ${role}`);await query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)",[user??'',role]);try{return await fn()}finally{await db.exec('reset role')}};
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;grant usage on schema auth,public to anon,authenticated,service_role;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
create table auth.users(id uuid primary key);
create table public.accounts(id uuid primary key,status text);
create table public.tenants(id uuid primary key,user_id uuid,account_id uuid);
create table public.projects(id uuid primary key,tenant_id uuid,client_portal_enabled boolean default true);
create table public.tenant_members(id uuid default gen_random_uuid(),tenant_id uuid,user_id uuid,role text);
create table public.project_stakeholders(id uuid default gen_random_uuid(),tenant_id uuid,project_id uuid,user_id uuid,status text);
create table public.media(id uuid primary key,tenant_id uuid,project_id uuid,type text,file_url text);
create table public.ai_analysis(id uuid primary key default gen_random_uuid(),media_id uuid,completion_percent integer,risk_level text);
create table public.analysis_jobs(id uuid primary key default gen_random_uuid(),tenant_id uuid,media_id uuid,status text,priority text,request_key text,provider_metadata jsonb,started_at timestamptz default now());
create unique index one_active_analysis_job_per_media on analysis_jobs(media_id) where status in ('pending','queued','processing');
create unique index analysis_jobs_tenant_request_key on analysis_jobs(tenant_id,request_key) where request_key is not null;
`);
function helper(file,name){const text=readFileSync(root+file,'utf8');const start=text.indexOf('create or replace function public.'+name+'(');assert(start>=0);const end=text.indexOf('$$;',text.indexOf('as $$',start));return text.slice(start,end+3)}
for(const name of ['is_internal_tenant_reader_for_tenant','is_portal_stakeholder_for_project'])await db.exec(helper('20260329140000_stakeholder_rls_isolation.sql',name));
await db.exec(helper('20260906092000_harden_viewer_project_jobs_estimate_writes.sql','project_belongs_to_tenant'));

await db.exec(readFileSync(root+'20261003170000_customer_intake_drafts.sql','utf8'));
await db.exec(readFileSync(root+'20261011091100_hide_intake_policy_helpers.sql','utf8'));
await db.exec(helper('20260906104000_project_write_authorization_hardening.sql','is_internal_tenant_writer_for_tenant'));
for(let n=1;n<=6;n++)await query('insert into auth.users values($1)',[id(n)]);
for(let n=1;n<=2;n++){await query("insert into accounts values($1,'active')",[id(100+n)]);await query('insert into tenants values($1,$2,$3)',[id(200+n),id(n),id(100+n)]);await query('insert into projects values($1,$2,true)',[id(300+n),id(200+n)]);}
await query('insert into projects values($1,$2,true)',[id(303),id(201)]);
for(const [user,role] of [[3,'stakeholder'],[4,'viewer'],[5,'member'],[6,'admin']])await query('insert into tenant_members(tenant_id,user_id,role) values($1,$2,$3)',[id(201),id(user),role]);
await query("insert into tenant_members(tenant_id,user_id,role) values($1,$2,'member')",[id(202),id(5)]);
await query("insert into project_stakeholders(tenant_id,project_id,user_id,status) values($1,$2,$3,'active')",[id(201),id(301),id(3)]);
for(const [media,tenant,project] of [[401,201,301],[402,201,303],[403,202,302]])await query("insert into media values($1,$2,$3,'image','https://example.invalid/image.jpg')",[id(media),id(tenant),id(project)]);
await query("insert into ai_analysis values($1,$2,20,'low')",[id(501),id(401)]);
const src=readFileSync(root+'20261011112701_harden_media_analysis_access.sql','utf8');
await db.exec(src);await db.exec(src);
const rows=async user=>as('authenticated',id(user),async()=> (await query('select id from media order by id')).rows.map(x=>x.id));
await test('stakeholder sees only own project',async()=>assert.deepEqual(await rows(3),[id(401)]));
for(const user of [1,4,6])await test('internal reader '+user+' sees only own tenant',async()=>assert.deepEqual(await rows(user),[id(401),id(402)]));
await test('foreign tenant owner sees only its media',async()=>assert.deepEqual(await rows(2),[id(403)]));
for(const user of [3,4]){
 await test('read-only user '+user+' cannot insert',()=>as('authenticated',id(user),()=>denied("insert into media values($1,$2,$3,'image','https://example.invalid/new.jpg')",[id(410),id(201),id(301)],'42501')));
 await test('read-only user '+user+' cannot update/delete',()=>as('authenticated',id(user),async()=>{assert.equal((await query("update media set file_url='x' where id=$1 returning id",[id(401)])).rows.length,0);assert.equal((await query('delete from media where id=$1 returning id',[id(401)])).rows.length,0)}));
}
await test('member can insert/update/delete without identity changes',()=>as('authenticated',id(5),async()=>{await query("insert into media values($1,$2,$3,'image','https://example.invalid/member.jpg')",[id(411),id(201),id(301)]);assert.equal((await query("update media set type='image' where id=$1 returning id",[id(411)])).rows.length,1);assert.equal((await query('delete from media where id=$1 returning id',[id(411)])).rows.length,1)}));
// URL immutability is a separate existing live trigger covered in native tests;
// this minimal contract verifies the new identity trigger and policies.
for(const [column,value] of [['id',id(499)],['project_id',id(303)],['tenant_id',id(202)],['type','video']])await test('member cannot rewrite '+column,()=>as('authenticated',id(5),()=>denied('update media set '+column+'=$1 where id=$2',[value,id(401)],'42501')));
for(const user of [1,3,4,5,6])await test('client '+user+' cannot forge or delete AI result',()=>as('authenticated',id(user),async()=>{await denied('update ai_analysis set completion_percent=99',[],'42501');await denied('delete from ai_analysis',[],'42501');await denied("insert into ai_analysis(media_id,completion_percent,risk_level) values($1,99,'low')",[id(401)],'42501')}));
await test('stakeholder cannot read internal AI results',()=>as('authenticated',id(3),async()=>assert.equal((await query('select * from ai_analysis')).rows.length,0)));
await test('viewer retains AI result reads',()=>as('authenticated',id(4),async()=>assert.equal((await query('select * from ai_analysis')).rows.length,1)));
await test('revoked grant hides project media',async()=>{await query("update project_stakeholders set status='revoked'");assert.deepEqual(await rows(3),[]);await query("update project_stakeholders set status='active'")});
await test('disabled portal hides stakeholder media',async()=>{await query('update projects set client_portal_enabled=false where id=$1',[id(301)]);assert.deepEqual(await rows(3),[]);await query('update projects set client_portal_enabled=true where id=$1',[id(301)])});
await test('suspended account hides data and denies uploads',async()=>{await query("update accounts set status='suspended' where id=$1",[id(101)]);for(const user of [1,3,4,6])assert.deepEqual(await rows(user),[]);await as('authenticated',id(5),()=>denied("insert into media values($1,$2,$3,'image','https://example.invalid/suspended.jpg')",[id(412),id(201),id(301)],'42501'));await query("update accounts set status='active' where id=$1",[id(101)])});
await test('service writes remain available',()=>as('service_role',null,async()=>{await query("update ai_analysis set completion_percent=30");await query("update media set type='video' where id=$1",[id(401)])}));
await test('anon cannot read raw media/results',()=>as('anon',null,async()=>{await denied('select * from media',[],'42501');await denied('select * from ai_analysis',[],'42501')}));
// Execute the storage policy using the same real role/account helpers. Storage
// transport itself is verified separately against task-created live objects.
await db.exec(`create schema storage;
grant usage on schema storage to anon,authenticated,service_role;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]
$$;
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant select,insert on storage.objects to anon,authenticated,service_role;
`);
for(const prefix of [201,202,301,302,303])await query('insert into storage.objects(bucket_id,name) values($1,$2)',['media',id(prefix)+'/fixture.txt']);
await query("insert into storage.objects(bucket_id,name) values('other',$1),('media','not-a-uuid/fixture.txt')",[id(201)+'/fixture.txt']);
const storageSql=readFileSync(root+'20261011134735_harden_media_storage_role_access.sql','utf8');
await db.exec(storageSql);await db.exec(storageSql);
const objects=async user=>as('authenticated',id(user),async()=> (await query('select name from storage.objects order by name')).rows.map(x=>x.name));
const ownObjects=[201,301,303].map(n=>id(n)+'/fixture.txt').sort();
for(const user of [1,4,6])await test('storage internal reader '+user+' keeps both path layouts',async()=>assert.deepEqual(await objects(user),ownObjects));
await test('storage multi-tenant member only sees authorized tenants',async()=>assert.equal((await objects(5)).length,5));
await test('storage stakeholder cannot read or sign any raw tenant object',async()=>assert.deepEqual(await objects(3),[]));
await test('storage revoked stakeholder remains denied',async()=>{await query("update project_stakeholders set status='revoked'");assert.deepEqual(await objects(3),[]);await query("update project_stakeholders set status='active'")});
for(const user of [3,4])for(const prefix of [201,301])await test('storage upload denied for role '+user+' path '+prefix,()=>as('authenticated',id(user),()=>denied("insert into storage.objects(bucket_id,name) values('media',$1)",[id(prefix)+'/denied-'+user+'.txt'],'42501')));
for(const user of [1,5,6])for(const prefix of [201,301])await test('storage internal writer '+user+' path '+prefix,()=>as('authenticated',id(user),()=>query("insert into storage.objects(bucket_id,name) values('media',$1)",[id(prefix)+'/writer-'+user+'.txt'])));
for(const prefix of [202,302])await test('storage foreign tenant upload denied '+prefix,()=>as('authenticated',id(1),()=>denied("insert into storage.objects(bucket_id,name) values('media',$1)",[id(prefix)+'/foreign.txt'],'42501')));
await test('storage unknown prefixes and buckets fail closed',()=>as('authenticated',id(1),async()=>{await denied("insert into storage.objects(bucket_id,name) values('media','bad-prefix/test.txt')",[],'42501');await denied("insert into storage.objects(bucket_id,name) values('other',$1)",[id(201)+'/test.txt'],'42501')}));
await test('storage suspended account removes reads and uploads',async()=>{await query("update accounts set status='suspended' where id=$1",[id(101)]);for(const user of [1,3,4,6])assert.deepEqual(await objects(user),[]);await as('authenticated',id(5),()=>denied("insert into storage.objects(bucket_id,name) values('media',$1)",[id(201)+'/suspended.txt'],'42501'));await query("update accounts set status='active' where id=$1",[id(101)])});
await test('storage anonymous access and upload denied',()=>as('anon',null,async()=>{assert.equal((await query('select * from storage.objects')).rows.length,0);await denied("insert into storage.objects(bucket_id,name) values('media',$1)",[id(201)+'/anonymous.txt'],'42501')}));
await test('storage service worker access remains available',()=>as('service_role',null,async()=>{assert((await query('select * from storage.objects')).rows.length>0);await query("insert into storage.objects(bucket_id,name) values('media','service/fixture.txt')")}));
await db.close();console.log(passed.length+' media/storage RLS SQL checks PASS');
