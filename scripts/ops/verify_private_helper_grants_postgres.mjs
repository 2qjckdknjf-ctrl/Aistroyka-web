import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

const repo = process.argv[2];
assert(repo, 'Pass repository path; this harness never connects to Supabase');
const nativeUrl = process.env.HELPER_GRANTS_NATIVE_DATABASE_URL;
let db;
if (nativeUrl) {
  const url = new URL(nativeUrl);
  assert(['127.0.0.1', 'localhost'].includes(url.hostname), 'Loopback database only');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: nativeUrl });
  assert(['127.0.0.1', 'localhost', '/var/run/postgresql'].includes(client.connectionParameters.host));
  await client.connect();
  assert.equal((await client.query("select count(*)::int n from pg_tables where schemaname='public'")).rows[0].n, 0);
  db = { exec: sql => client.query(sql), query: (sql, args) => client.query(sql, args), close: () => client.end() };
} else {
  db = new PGlite();
}
const q = (sql, args = []) => db.query(sql, args);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const migrationDir = resolve(repo, 'apps/web/supabase/migrations');
const sql = readFileSync(resolve(migrationDir, '20261013090432_harden_private_helper_execute_grants.sql'), 'utf8');
const helpers = [
  ['can_manage_project_membership', 'uuid,uuid'], ['can_read_project_membership', 'uuid,uuid'],
  ['is_internal_tenant_writer_for_tenant', 'uuid'], ['is_tenant_owner_or_admin', 'uuid'],
  ['project_belongs_to_tenant', 'uuid,uuid'],
];
const triggers = [
  ['enforce_customer_estimate_decision_via_service', 'customer_estimates', 'insert or update'],
  ['enforce_field_daily_log_identity_immutable', 'field_daily_logs', 'insert or update'],
  ['enforce_jobs_authenticated_update_guard', 'jobs', 'update'],
  ['enforce_project_members_privilege_change', 'project_members', 'update'],
  ['enforce_tenant_members_role_change', 'tenant_members', 'update'],
  ['jobs_protect_payload_project_tenant', 'jobs', 'insert or update'],
  ['media_protect_file_url', 'media', 'update'],
];
// Consume the latest source definitions, rather than substitute permissive guards.
function definition(name) {
  const pattern = new RegExp(`create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.${name}\\s*\\([\\s\\S]*?\\bas\\s+(\\$[^$]*\\$)[\\s\\S]*?\\1\\s*;`, 'gi');
  let found;
  for (const path of readdirSync(migrationDir).filter(x => x.endsWith('.sql')).sort()) {
    const text = readFileSync(resolve(migrationDir, path), 'utf8');
    for (const match of text.matchAll(pattern)) found = match[0];
  }
  assert(found, `Missing original definition: ${name}`);
  return found;
}
const passed = [];
async function test(name, fn) { await fn(); passed.push(name); console.log('PASS', name); }
async function denied(sqlText, args = [], code = '42501') {
  let error;
  try { await q(sqlText, args); } catch (e) { error = e; }
  assert.equal(error?.code, code);
}
async function role(name, fn) {
  assert(['anon', 'authenticated', 'service_role'].includes(name));
  await q("select set_config('request.jwt.claim.role',$1,false)", [name]);
  await q(`set role ${name}`);
  try { await fn(); } finally { await q('reset role'); }
}
async function snapshot() {
  return (await q(`select p.oid::text, p.proname, pg_get_functiondef(p.oid) definition
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' order by p.proname`)).rows;
}
try {
  await db.exec(`
    do $$declare role_name text; begin
      foreach role_name in array array['anon','authenticated','service_role'] loop
        if not exists(select 1 from pg_roles where rolname=role_name) then
          execute format('create role %I',role_name);
        end if;
      end loop;
    end$$;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
    create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    create table tenants(id uuid primary key,user_id uuid);
    create table projects(id uuid primary key,tenant_id uuid);
    create table tenant_members(id uuid primary key,tenant_id uuid,user_id uuid,role text);
    create table project_members(id uuid primary key,tenant_id uuid,project_id uuid,user_id uuid,role text,status text);
    create table tenant_invitations(tenant_id uuid,email text,expires_at timestamptz,role text);
    create table project_stakeholders(tenant_id uuid,email text,expires_at timestamptz,status text);
    create table customer_estimates(id uuid primary key,status text,approved_by_customer_at timestamptz,rejected_by_customer_at timestamptz);
    create table field_daily_logs(id uuid primary key,tenant_id uuid,project_id uuid,status text,created_by uuid,created_at timestamptz,confirmed_by uuid,confirmed_at timestamptz);
    create table media(id uuid primary key,tenant_id uuid,file_url text);
    create table jobs(id uuid primary key,tenant_id uuid,user_id uuid,payload jsonb,type text,status text,attempts int,max_attempts int,run_after timestamptz,locked_by text,locked_at timestamptz,last_error text,last_error_type text,trace_id text,dedupe_key text);
    create table helper_projection(id uuid primary key,tenant_id uuid,project_id uuid);
    grant select,insert,update on all tables in schema public to authenticated,service_role;
  `);
  for (const [name] of [...helpers, ...triggers]) await db.exec(definition(name));
  // Model the observed live defaults and explicit client grants.
  await db.exec('grant execute on all functions in schema public to public,anon,authenticated,service_role');
  for (const [name, table, events] of triggers) {
    await db.exec(`create trigger fixture_${name} before ${events} on ${table} for each row execute function public.${name}()`);
  }
  await db.exec(`alter table helper_projection enable row level security;
    create policy scoped_projection on helper_projection for select to authenticated
    using (public.can_read_project_membership(tenant_id,project_id));`);
  await q('insert into tenants values($1,$2)', [id(1), id(100)]);
  await q('insert into projects values($1,$2)', [id(10), id(1)]);
  await q('insert into tenant_members values($1,$2,$3,$4)', [id(20), id(1), id(101), 'member']);
  await q('insert into project_members values($1,$2,$3,$4,$5,$6)', [id(21), id(1), id(10), id(101), 'worker', 'active']);
  await q('insert into helper_projection values($1,$2,$3)', [id(30), id(1), id(10)]);
  await q("insert into jobs(id,tenant_id,payload,status,dedupe_key) values($1,$2,'{}','success','original')", [id(40), id(1)]);
  await q('insert into media values($1,$2,$3)', [id(50), id(1), 'immutable.jpg']);
  await test('reproduces anonymous project/tenant existence lookup before repair', async () => {
    await role('anon', async () => assert.equal((await q('select project_belongs_to_tenant($1,$2) found', [id(10), id(1)])).rows[0].found, true));
  });
  const before = await snapshot();
  const bindingsBefore = (await q('select oid::text,tgfoid::text from pg_trigger where not tgisinternal order by oid')).rows;
  await db.exec(sql);
  await test('migration retains function bodies and identities', async () => assert.deepEqual(await snapshot(), before));
  await test('migration retains all original trigger bindings', async () => assert.deepEqual((await q('select oid::text,tgfoid::text from pg_trigger where not tgisinternal order by oid')).rows, bindingsBefore));
  for (const [name, args] of helpers) {
    await test(`${name}: anon denied, authenticated/service helper access retained`, async () => {
      const sig = `public.${name}(${args})`;
      const row = (await q(`select has_function_privilege('anon',$1,'execute') a,
        has_function_privilege('authenticated',$1,'execute') u,has_function_privilege('service_role',$1,'execute') s`, [sig])).rows[0];
      assert.deepEqual(row, { a: false, u: true, s: true });
      const params = args.split(',').map((_, i) => `$${i + 1}`).join(',');
      await role('anon', () => denied(`select public.${name}(${params})`, args.split(',').map(() => id(1))));
    });
  }
  for (const [name] of triggers) {
    await test(`${name}: direct client RPC denied, service access retained`, async () => {
      const sig = `public.${name}()`;
      assert.deepEqual((await q(`select has_function_privilege('anon',$1,'execute') a,
        has_function_privilege('authenticated',$1,'execute') u,has_function_privilege('service_role',$1,'execute') s`, [sig])).rows[0], { a: false, u: false, s: true });
      await role('authenticated', () => denied(`select public.${name}()`));
    });
  }
  await q("select set_config('request.jwt.claim.sub',$1,false)", [id(101)]);
  await role('authenticated', async () => {
    await test('existing membership-based RLS allows assigned worker', async () => assert.equal((await q('select * from helper_projection')).rows.length, 1));
    await test('terminal job may still release its dedupe key through its existing trigger', async () => {
      await q('update jobs set dedupe_key=null where id=$1', [id(40)]);
      assert.equal((await q('select dedupe_key from jobs where id=$1', [id(40)])).rows[0].dedupe_key, null);
    });
    await test('job lifecycle forgery still reaches and is blocked by original guard', () => denied("update jobs set status='queued' where id=$1", [id(40)], 'P0001'));
    await test('foreign project job payload still blocked by original trigger', () => denied("insert into jobs(id,tenant_id,payload) values($1,$2,jsonb_build_object('project_id',$3::text))", [id(41), id(2), id(10)]));
    await test('media URL mutation still blocked by original trigger', () => denied('update media set file_url=$1 where id=$2', ['changed.jpg', id(50)]));
    await test('project self-promotion still blocked by original trigger', () => denied("update project_members set role='owner' where id=$1", [id(21)], 'P0001'));
    await test('tenant self-promotion still blocked by original trigger', () => denied("update tenant_members set role='owner' where id=$1", [id(20)], 'P0001'));
    await test('commercial approval forgery still blocked by original trigger', () => denied("insert into customer_estimates(id,status) values($1,'approved')", [id(60)], 'P0001'));
    await test('daily log still stamps caller identity and confirmation server-side', async () => {
      await q("insert into field_daily_logs(id,tenant_id,status,created_by) values($1,$2,'draft',$3)", [id(70), id(1), id(999)]);
      await q("update field_daily_logs set status='confirmed',confirmed_by=$1 where id=$2", [id(999), id(70)]);
      const row = (await q('select created_by,confirmed_by from field_daily_logs where id=$1', [id(70)])).rows[0];
      assert.deepEqual(row, { created_by: id(101), confirmed_by: id(101) });
      await denied("update field_daily_logs set status='draft' where id=$1", [id(70)], 'P0001');
    });
  });
  await q("select set_config('request.jwt.claim.sub',$1,false)", [id(999)]);
  await test('unassigned actor remains excluded by existing RLS', () => role('authenticated', async () => assert.equal((await q('select * from helper_projection')).rows.length, 0)));
  await test('authorized service operations remain supported by existing guards', () => role('service_role', async () => {
    await q('update media set file_url=$1 where id=$2', ['service-updated.jpg', id(50)]);
    await q("insert into customer_estimates(id,status) values($1,'approved')", [id(61)]);
  }));
  await test('repeat migration preserves definitions, permissions and trigger bindings', async () => {
    await db.exec(sql);
    assert.deepEqual(await snapshot(), before);
    assert.deepEqual((await q('select oid::text,tgfoid::text from pg_trigger where not tgisinternal order by oid')).rows, bindingsBefore);
    assert.equal((await q("select has_function_privilege('anon','public.project_belongs_to_tenant(uuid,uuid)','execute') x")).rows[0].x, false);
  });
  console.log(JSON.stringify({ engine: nativeUrl ? 'native_postgres' : 'pglite', passed: passed.length, hosted_database_touched: false }));
} finally { await db.close(); }
