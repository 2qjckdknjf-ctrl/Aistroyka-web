// Run in an isolated PGlite runtime: node <this-file> <absolute-repository-path>.
// Minimal target contract; native PostgreSQL/PostgREST concurrency is separate evidence.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const repo = process.argv[2]; assert(repo, 'Pass the absolute repository path');
const db = new PGlite(); const passed = [];
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const test = async (name, fn) => { await fn(); passed.push(name); console.log('PASS', name); };
const query = (s, p = []) => db.query(s, p);
const as = async (role, fn) => {
  await db.exec(`set role ${role}`); await query("select set_config('request.jwt.claim.role',$1,false)", [role]);
  try { return await fn(); } finally { await db.exec('reset role'); }
};
const denied = async fn => { try { await fn(); assert.fail('Expected denial'); } catch (e) { assert.equal(e.code, '42501', e.message); } };
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;grant usage on schema auth,public to anon,authenticated,service_role;
create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
alter default privileges in schema public grant all on tables to service_role;
create table public.analysis_jobs(id uuid primary key,tenant_id uuid,media_id uuid,status text,execution_token uuid,
finished_at timestamptz,error_message text,error_type text,attempt_count integer not null default 0);
create table public.ai_analysis(media_id uuid,job_id uuid,stage text,completion_percent integer check(completion_percent between 0 and 100),
risk_level text check(risk_level in ('low','medium','high')),detected_issues text[],recommendations text[],frame_count integer);
`);
await db.exec(readFileSync(repo + '/apps/web/supabase/migrations/20261003145000_analysis_jobs_attempt_count.sql', 'utf8'));
const migration = readFileSync(repo + '/apps/web/supabase/migrations/20261011110418_complete_session_analysis_job.sql', 'utf8');
await db.exec(migration); await db.exec(migration);
await query("insert into analysis_jobs values($1,$2,$3,'processing',$4,null,null,null,0)", [id(1), id(10), id(20), id(30)]);
const complete = (tenant = id(10), token = id(30), percent = 20) => query('select public.complete_session_analysis_job($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id(1), tenant, token, 'foundation', percent, 'low', [], [], null]);
const fail = (tenant = id(10), token = id(30)) => query('select public.fail_session_analysis_job($1,$2,$3,$4,$5)', [id(1), tenant, token, 'synthetic timeout', 'timeout']);
for (const role of ['anon', 'authenticated']) {
  await test(role + ' cannot complete', () => as(role, () => denied(() => complete())));
  await test(role + ' cannot fail', () => as(role, () => denied(() => fail())));
}
for (const [name, tenant, token] of [['foreign tenant', id(11), id(30)], ['stale token', id(10), id(31)], ['null token', id(10), null]]) {
  await test(name + ' cannot complete', () => as('service_role', () => denied(() => complete(tenant, token))));
  await test(name + ' cannot fail', () => as('service_role', () => denied(() => fail(tenant, token))));
}
await test('invalid result rolls back and leaves job processing', async () => {
  await as('service_role', async () => { try { await complete(id(10), id(30), 101); assert.fail('Expected constraint failure'); } catch (e) { assert.equal(e.code, '23514'); } });
  assert.equal((await query('select count(*)::int as n from ai_analysis')).rows[0].n, 0);
  assert.equal((await query('select status from analysis_jobs')).rows[0].status, 'processing');
});
await test('owned completion writes one result and terminal state', async () => {
  await as('service_role', () => complete());
  assert.equal((await query('select count(*)::int as n from ai_analysis')).rows[0].n, 1);
  assert.equal((await query('select status from analysis_jobs')).rows[0].status, 'completed');
});
await test('late failure cannot overwrite completed result', () => as('service_role', () => denied(() => fail())));
await query("update analysis_jobs set status='processing',execution_token=$1 where id=$2", [id(32), id(1)]);
await test('replaced execution owner denies stale callbacks', () => as('service_role', () => denied(() => fail())));
await test('current owner retains existing failure accounting', async () => {
  await as('service_role', () => fail(id(10), id(32)));
  assert.deepEqual((await query('select status,attempt_count from analysis_jobs')).rows, [{ status: 'failed', attempt_count: 1 }]);
});
await db.close(); console.log(passed.length + ' session SQL contract checks PASS');
