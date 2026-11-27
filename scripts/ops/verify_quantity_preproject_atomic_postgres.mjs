import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const repo = process.argv[2];
assert(repo, 'Pass the repository root');
const migrations = repo + '/apps/web/supabase/migrations/';
const nativeUrl = process.env.QUANTITY_PREPROJECT_DATABASE_URL;
let NativeClient, nativeClient, db;
if (nativeUrl) {
  assert(['localhost', '127.0.0.1'].includes(new URL(nativeUrl).hostname), 'Use an isolated local database');
  ({ Client: NativeClient } = await import('pg'));
  nativeClient = new NativeClient({ connectionString: nativeUrl });
  assert(['localhost', '127.0.0.1', '/var/run/postgresql'].includes(nativeClient.connectionParameters.host));
  await nativeClient.connect();
  assert.equal((await nativeClient.query("select count(*)::int as n from pg_tables where schemaname in ('public','auth','app_private')")).rows[0].n, 0);
  db = { exec: sql => nativeClient.query(sql), query: (sql, args) => nativeClient.query(sql, args), close: () => nativeClient.end() };
} else db = new PGlite();

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const q = (sql, args = []) => db.query(sql, args);
let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
async function as(user, fn, role = 'authenticated') {
  await db.exec('set role ' + role);
  await q("select set_config('request.jwt.claim.sub',$1,false)", [user ? id(user) : '']);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function denied(sql, args, code, message) {
  let error; try { await q(sql, args); } catch (e) { error = e; }
  assert(error, 'Expected rejection'); assert.equal(error.code, code);
  if (message) assert.equal(error.message, message);
}
function helper(file, name) {
  const sql = readFileSync(migrations + file, 'utf8');
  const start = sql.indexOf('create or replace function public.' + name + '(');
  assert(start >= 0);
  return sql.slice(start, sql.indexOf('$$;', sql.indexOf('as $$', start)) + 3);
}
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema app_private; grant usage on schema auth,public,app_private to anon,authenticated,service_role;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create table auth.users(id uuid primary key);
  create table accounts(id uuid primary key,status text);
  create table tenants(id uuid primary key,user_id uuid,account_id uuid);
  create table projects(id uuid primary key,tenant_id uuid);
  create table tenant_members(tenant_id uuid,user_id uuid,role text);
  create table customer_intake_drafts(id uuid primary key,tenant_id uuid,project_id uuid,title text,description text,status text,created_by uuid,updated_at timestamptz default now());
  grant select,update on customer_intake_drafts to authenticated;
`);
await db.exec(helper('20260906104000_project_write_authorization_hardening.sql', 'is_internal_tenant_writer_for_tenant'));
await db.exec(helper('20260906092000_harden_viewer_project_jobs_estimate_writes.sql', 'project_belongs_to_tenant'));
await db.exec(helper('20260906092000_harden_viewer_project_jobs_estimate_writes.sql', 'is_tenant_owner_or_admin'));
await db.exec(helper('20261003170000_customer_intake_drafts.sql', 'customer_intake_tenant_account_active')
  .replace('function public.customer_intake', 'function app_private.customer_intake'));
await db.exec(`alter table customer_intake_drafts enable row level security;
  create policy intake_read on customer_intake_drafts for select to authenticated using (
    public.is_internal_tenant_writer_for_tenant(tenant_id) or created_by=auth.uid());
  create policy intake_write on customer_intake_drafts for update to authenticated using (created_by=auth.uid()) with check (created_by=auth.uid());`);
for (const file of ['20261028160000_stage2a_a01_quantity_storage.sql', '20261028170000_preproject_extraction_observations.sql', '20261030230000_ais_client_005a_intake_draft_idempotency.sql']) {
  await db.exec(readFileSync(migrations + file, 'utf8'));
}
for (const user of [1, 2, 3, 4, 5]) await q('insert into auth.users values($1)', [id(user)]);
await q("insert into accounts values($1,'active'),($2,'active')", [id(101), id(102)]);
await q('insert into tenants values($1,$2,$3),($4,$5,$6)', [id(11), id(1), id(101), id(12), id(2), id(102)]);
await q('insert into projects values($1,$2),($3,$4),($5,$2)', [id(21), id(11), id(22), id(12), id(23)]);
await q("insert into tenant_members values($1,$2,'viewer')", [id(11), id(3)]);
await q("insert into tenant_members values($1,$2,'member')", [id(11), id(4)]);
for (const draft of [31, 32, 33, 34, 35, 36, 37, 38]) await q("insert into customer_intake_drafts(id,tenant_id,project_id,title,description,status,created_by) values($1,$2,null,'Fixture','Kitchen','draft',$3)", [id(draft), id(11), id(5)]);

// Reproduce the original two-round-trip problems before introducing the repair.
const oldSpec = `insert into quantity_work_specifications(tenant_id,project_id,work_code,rule_version,unit,quantity_basis,rule_id,title,revision,created_by)
  values($1,$2,$3,'1.0.0','m2','physical_net','rule','Fixture',$4,$5) returning id`;
const r1 = (await q("select coalesce(max(revision),0)+1 as n from quantity_work_specifications where work_code='baseline'")).rows[0].n;
const r2 = (await q("select coalesce(max(revision),0)+1 as n from quantity_work_specifications where work_code='baseline'")).rows[0].n;
await q(oldSpec, [id(11), id(21), 'baseline', r1, id(1)]);
await denied(oldSpec, [id(11), id(21), 'baseline', r2, id(1)], '23505');
console.log('REPRODUCED baseline concurrent max+1 collision');
await q(`insert into preproject_extraction_runs(id,tenant_id,project_id,intake_draft_id,source_ref,provider_meta,created_by)
  values($1,$2,$3,$4,'text_heuristic.v1','{"engine":"text_heuristic.v1","observation_count":1}',$5)`, [id(40), id(11), id(21), id(31), id(1)]);
assert.equal((await q('select count(*)::int as n from preproject_observations where run_id=$1', [id(40)])).rows[0].n, 0);
console.log('REPRODUCED baseline persisted run without its required observations');

const sql = readFileSync(migrations + '20261127172000_quantity_preproject_atomic_create.sql', 'utf8');
await test('migration applies and is repeatable', async () => { await db.exec(sql); await db.exec(sql); });
const spec = { work_code: 'Q-TILE-FLOOR', rule_version: '1.0.0', unit: 'm2', quantity_basis: 'physical_net', rule_id: 'floor', title: 'Synthetic floor' };
const request = { kind: 'area', work_code: spec.work_code, rule_version: '1.0.0', quantity_kind: 'planned', surfaces: [] };
const snapshotSql = 'select create_quantity_snapshot_atomic($1,$2,$3,$4,$5,$6,$7) as result';
const snapshotArgs = (hash, extra = {}) => [id(11), id(21), id(1), spec, { ...request, ...extra }, hash, '[]'];
const obs = [{ kind: 'room', label: 'Kitchen', payload: {}, uncertainty: 'medium', source_coords: { field: 'text' } }];
const extractionSql = 'select create_preproject_extraction_atomic($1,$2,$3,$4,$5,$6) as result';
const extractionArgs = (draft, options = {}) => [id(11), id(options.project ?? 21), id(1), draft ? id(draft) : null, options.hash ?? 'a'.repeat(64), JSON.stringify(options.observations ?? obs)];
let first;
await test('atomic snapshot creates a specification and one immutable snapshot', () => as(1, async () => {
  first = (await q(snapshotSql, snapshotArgs('a'.repeat(64)))).rows[0].result;
  assert.equal(first.created, true); assert(first.snapshot.work_specification_id);
}));
await test('same hash reuses snapshot without an unused specification', () => as(1, async () => {
  const before = (await q('select count(*)::int as n from quantity_work_specifications')).rows[0].n;
  const replay = (await q(snapshotSql, snapshotArgs('a'.repeat(64)))).rows[0].result;
  assert.equal(replay.created, false); assert.equal(replay.snapshot.id, first.snapshot.id);
  assert.equal((await q('select count(*)::int as n from quantity_work_specifications')).rows[0].n, before);
}));
await test('failed snapshot insertion rolls back its specification', () => as(1, async () => {
  const before = (await q('select count(*)::int as n from quantity_work_specifications')).rows[0].n;
  await denied(snapshotSql, snapshotArgs('b'.repeat(64), { kind: 'invalid-fixture-kind' }), '23514');
  assert.equal((await q('select count(*)::int as n from quantity_work_specifications')).rows[0].n, before);
}));
await test('existing hash cannot be used for a different request', () => as(1, () => denied(snapshotSql, snapshotArgs('a'.repeat(64), { quantity_kind: 'different' }), '22023')));
await test('snapshot rejects a foreign project', () => as(1, async () => {
  const args = snapshotArgs('b'.repeat(64)); args[1] = id(22); await denied(snapshotSql, args, '42501');
}));
await test('snapshot rejects a forged actor', () => as(1, async () => {
  const args = snapshotArgs('b'.repeat(64)); args[2] = id(2); await denied(snapshotSql, args, '42501');
}));
await test('member cannot use the RPC to bypass planned/accepted/system-complete policy', () => as(4, async () => {
  for (const kind of ['planned', 'accepted', 'system_complete']) {
    const args = snapshotArgs('b'.repeat(64), { quantity_kind: kind }); args[2] = id(4);
    await denied(snapshotSql, args, '42501');
  }
  const args = snapshotArgs('c'.repeat(64), { quantity_kind: 'measured' }); args[2] = id(4);
  assert.equal((await q(snapshotSql, args)).rows[0].result.snapshot.quantity_kind, 'measured');
}));
await test('viewer cannot use either create RPC', () => as(3, async () => {
  await denied(snapshotSql, snapshotArgs('b'.repeat(64)), '42501');
  await denied(extractionSql, extractionArgs(32), '42501');
}));
await test('anonymous has no execute privilege', () => as(null, async () => {
  await denied(snapshotSql, snapshotArgs('b'.repeat(64)), '42501');
  await denied(extractionSql, extractionArgs(32), '42501');
}, 'anon'));
await test('legacy incomplete extraction fails explicitly, without inventing observations', () => as(1, async () => {
  await denied(extractionSql, extractionArgs(31), 'P0001', 'RUN_INCOMPLETE');
  assert.equal((await q('select count(*)::int as n from preproject_observations where run_id=$1', [id(40)])).rows[0].n, 0);
}));
let extraction;
await test('atomic extraction stores the run and all observations', () => as(1, async () => {
  extraction = (await q(extractionSql, extractionArgs(32))).rows[0].result;
  assert.equal(extraction.reused, false); assert.equal(extraction.run.observations.length, 1);
  assert.equal(extraction.run.provider_meta.input_hash, 'a'.repeat(64));
}));
await test('same intake replay returns the complete original run', () => as(1, async () => {
  const replay = (await q(extractionSql, extractionArgs(32))).rows[0].result;
  assert.equal(replay.reused, true); assert.equal(replay.run.id, extraction.run.id); assert.equal(replay.run.observations.length, 1);
}));
await test('an unassigned intake already used elsewhere cannot cross projects', () => as(1, () => denied(extractionSql, extractionArgs(32, { project: 23 }), 'P0001', 'DRAFT_PROJECT_MISMATCH')));
await test('a different input cannot silently reuse the same completed draft', () => as(1, () => denied(extractionSql, extractionArgs(32, { hash: 'b'.repeat(64) }), 'P0001', 'DRAFT_INPUT_MISMATCH')));
await test('failed observation insert rolls back the run and allows valid retry', () => as(1, async () => {
  await denied(extractionSql, extractionArgs(33, { observations: [{ ...obs[0], label: '' }] }), '23514');
  assert.equal((await q('select count(*)::int as n from preproject_extraction_runs where intake_draft_id=$1', [id(33)])).rows[0].n, 0);
  assert.equal((await q(extractionSql, extractionArgs(33))).rows[0].result.run.observations.length, 1);
}));
await test('missing intake never creates a run', () => as(1, () => denied(extractionSql, extractionArgs(999), 'P0001', 'DRAFT_NOT_FOUND')));
await q("update customer_intake_drafts set status='withdrawn' where id=$1", [id(34)]);
await test('withdrawn intake never creates a run', () => as(1, () => denied(extractionSql, extractionArgs(34), 'P0001', 'DRAFT_WITHDRAWN')));
await test('unbound text extraction remains supported', () => as(1, async () => {
  const result = (await q(extractionSql, extractionArgs(null))).rows[0].result;
  assert.equal(result.run.intake_draft_id, null); assert.equal(result.run.observations.length, 1);
}));
await test('intake source locking does not grant the manager creator-only updates', () => as(1, async () => {
  assert.equal((await q("update customer_intake_drafts set title='Forbidden' where id=$1 returning id", [id(32)])).rows.length, 0);
  await q('select app_private.lock_intake_draft_for_extraction($1,$2,$3)', [id(11), id(21), id(32)]);
}));
await test('a customer creator cannot invoke the private internal extraction lock', () => as(5, () =>
  denied('select app_private.lock_intake_draft_for_extraction($1,$2,$3)', [id(11), id(21), id(32)], '42501')));
await q("update accounts set status='suspended' where id=$1", [id(101)]);
await test('source locking rejects a suspended tenant account', () => as(1, () =>
  denied(extractionSql, extractionArgs(35), '42501')));
await q("update accounts set status='active' where id=$1", [id(101)]);
for (const table of ['quantity_work_specifications', 'quantity_input_snapshots', 'preproject_extraction_runs', 'preproject_observations']) {
  await test('silent BEFORE INSERT rejection in ' + table + ' rolls back every row', async () => {
    await db.exec('create or replace function public.silent_fixture_insert() returns trigger language plpgsql as $$begin return null; end$$');
    await db.exec('create trigger silent_fixture before insert on ' + table + ' for each row execute function public.silent_fixture_insert()');
    const counts = async () => (await q(`select
      (select count(*)::int from quantity_work_specifications) as specs,
      (select count(*)::int from quantity_input_snapshots) as snapshots,
      (select count(*)::int from preproject_extraction_runs) as runs,
      (select count(*)::int from preproject_observations) as observations`)).rows[0];
    const before = await counts();
    await as(1, () => table.startsWith('quantity_')
      ? denied(snapshotSql, snapshotArgs('d'.repeat(64)), 'P0001')
      : denied(extractionSql, extractionArgs(35), 'P0001'));
    assert.deepEqual(await counts(), before);
    await db.exec('drop trigger silent_fixture on ' + table);
  });
}

if (nativeClient) {
  const clients = await Promise.all([1, 2].map(async () => {
    const client = new NativeClient({ connectionString: nativeUrl }); await client.connect();
    await client.query('set role authenticated');
    await client.query("select set_config('request.jwt.claim.sub',$1,false)", [id(1)]);
    return client;
  }));
  try {
    await test('two native clients create different snapshots for one work code without revision conflicts', async () => {
      const results = await Promise.all(clients.map((client, index) => client.query(snapshotSql, snapshotArgs(String(index + 3).repeat(64), { surfaces: [{ fixture: index }] }))));
      assert(results.every(result => result.rows[0].result.created));
      assert.notEqual(results[0].rows[0].result.snapshot.work_specification_id, results[1].rows[0].result.snapshot.work_specification_id);
    });
    await test('two native clients reuse one snapshot without orphan specifications', async () => {
      const before = (await q('select count(*)::int as n from quantity_work_specifications')).rows[0].n;
      const results = await Promise.all(clients.map(client => client.query(snapshotSql, snapshotArgs('5'.repeat(64)))));
      assert.equal(results[0].rows[0].result.snapshot.id, results[1].rows[0].result.snapshot.id);
      assert.deepEqual(results.map(r => r.rows[0].result.created).sort(), [false, true]);
      assert.equal((await q('select count(*)::int as n from quantity_work_specifications')).rows[0].n, before + 1);
    });
    await test('two native extraction clients see the same complete run', async () => {
      const results = await Promise.all(clients.map(client => client.query(extractionSql, extractionArgs(35))));
      assert.equal(results[0].rows[0].result.run.id, results[1].rows[0].result.run.id);
      assert(results.every(r => r.rows[0].result.run.observations.length === 1));
      assert.deepEqual(results.map(r => r.rows[0].result.reused).sort(), [false, true]);
    });
    await test('cross-project concurrent use of an unassigned intake has only one winner', async () => {
      const results = await Promise.allSettled(clients.map((client, index) => client.query(extractionSql, extractionArgs(36, { project: index ? 23 : 21 }))));
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      const rejected = results.find(r => r.status === 'rejected');
      assert.equal(rejected.reason.message, 'DRAFT_PROJECT_MISMATCH');
    });
    async function waitForBlock(client) {
      const pid = client.processID;
      for (let attempt = 0; attempt < 100; attempt++) {
        if ((await q('select cardinality(pg_blocking_pids($1)) as n', [pid])).rows[0].n > 0) return;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.fail('Expected source-row lock contention');
    }
    await test('withdrawal committed first makes the waiting extraction reject the source', async () => {
      const [extractor, creator] = clients;
      await creator.query("select set_config('request.jwt.claim.sub',$1,false)", [id(5)]);
      await creator.query('begin');
      await creator.query("update customer_intake_drafts set status='withdrawn' where id=$1", [id(37)]);
      const pending = extractor.query(extractionSql, extractionArgs(37)).then(value => ({ value }), error => ({ error }));
      await waitForBlock(extractor); await creator.query('commit');
      const result = await pending; assert.equal(result.error?.message, 'DRAFT_WITHDRAWN');
      assert.equal((await q('select count(*)::int as n from preproject_extraction_runs where intake_draft_id=$1', [id(37)])).rows[0].n, 0);
    });
    await test('extraction committed first holds the source stable until its observations are durable', async () => {
      const [extractor, creator] = clients;
      await extractor.query('begin');
      const result = (await extractor.query(extractionSql, extractionArgs(38))).rows[0].result;
      assert.equal(result.run.observations.length, 1);
      const pending = creator.query("update customer_intake_drafts set status='withdrawn' where id=$1 returning id", [id(38)]);
      await waitForBlock(creator); await extractor.query('commit');
      assert.equal((await pending).rows.length, 1);
      assert.equal((await q('select count(*)::int as n from preproject_observations where run_id=$1', [result.run.id])).rows[0].n, 1);
    });
  } finally { await Promise.all(clients.map(client => client.end())); }
} else console.log('Native two-client races are exercised by the isolated PostgreSQL CI job.');
await db.close();
console.log(`${passed} quantity/preproject SQL contracts PASS (${nativeClient ? 'native PostgreSQL' : 'PGlite'}); no remote database used`);
