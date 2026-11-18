import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const repo = process.argv[2]; assert(repo);
const sql = readFileSync(repo + '/apps/web/supabase/migrations/20261011230105_unique_published_evidence_sources.sql', 'utf8');
const nativeUrl = process.env.EVIDENCE_UNIQUE_NATIVE_DATABASE_URL;
let db, native, Client;
if (nativeUrl) {
  const url = new URL(nativeUrl); assert(['localhost', '127.0.0.1'].includes(url.hostname));
  ({ Client } = await import('pg')); native = new Client({ connectionString: nativeUrl });
  assert(['localhost', '127.0.0.1', '/var/run/postgresql'].includes(native.connectionParameters.host));
  await native.connect();
  assert.equal((await native.query("select count(*)::int as n from pg_tables where schemaname='public'")).rows[0].n, 0, 'Use an empty isolated database');
  db = { exec: s => native.query(s), query: (s, p) => native.query(s, p), close: () => native.end() };
} else db = new PGlite();
const q = (s, p = []) => db.query(s, p), id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const passes = [], test = async (name, fn) => { await fn(); passes.push(name); console.log('PASS', name); };
async function denied(fn) { let error; try { await fn(); } catch (e) { error = e; } assert.equal(error?.code, '23505'); }
async function insert(n, media, upload = null, visible = true, verified = true, retention = 'active', tenant = 1) {
  return q('insert into public.visual_evidence_records values($1,$2,$3,$4,$5,$6,$7)', [id(n), id(tenant), media ? id(media) : null, upload ? id(upload) : null, visible, verified, retention]);
}
try {
  await db.exec("do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;end$$");
  await db.exec('create table public.visual_evidence_records(id uuid primary key,tenant_id uuid not null,media_id uuid,upload_session_id uuid,owner_visible boolean not null,manager_verified boolean not null,retention_state text not null)');
  await insert(10, 101); await insert(11, 101);
  await test('migration refuses existing duplicates without deleting or rewriting them', async () => {
    await denied(() => db.exec(sql)); await db.exec('rollback');
    assert.equal((await q('select count(*)::int n from visual_evidence_records')).rows[0].n, 2);
  });
  await q('delete from visual_evidence_records where id in ($1,$2)', [id(10), id(11)]);
  await db.exec(sql);
  await test('readiness requires both valid unique indexes and anonymous callers cannot invoke it', async () => {
    assert.equal((await q('select public.published_evidence_source_guard_ready() ready')).rows[0].ready, true);
    assert.equal((await q("select has_function_privilege('anon','public.published_evidence_source_guard_ready()','execute') ok")).rows[0].ok, false);
    assert.equal((await q("select has_function_privilege('authenticated','public.published_evidence_source_guard_ready()','execute') ok")).rows[0].ok, true);
    await q('begin'); await q('drop index public.visual_evidence_one_published_media');
    assert.equal((await q('select public.published_evidence_source_guard_ready() ready')).rows[0].ready, false); await q('rollback');
  });
  await test('same media cannot be published twice', async () => { await insert(20, 102); await denied(() => insert(21, 102)); });
  await test('same upload cannot be published twice', async () => { await insert(22, null, 103); await denied(() => insert(23, null, 103)); });
  await test('overlapping dual-source records cannot bypass either constraint', async () => {
    await insert(24, 104, 105); await denied(() => insert(25, 104, 106)); await denied(() => insert(26, 107, 105));
  });
  await test('private revisions remain available without customer duplication', async () => { await insert(27, 104, 105, false, false); await insert(28, 104, 105, false, true); });
  await test('tenant boundary is preserved by the indexes', async () => { await insert(29, 104, 105, true, true, 'active', 2); });
  await test('withdrawal releases the publication slot and stale republication is denied', async () => {
    await q('update visual_evidence_records set owner_visible=false where id=$1', [id(24)]);
    await insert(30, 104, 105);
    await denied(() => q('update visual_evidence_records set owner_visible=true where id=$1', [id(24)]));
  });
  await test('archived evidence does not reserve an active publication slot', async () => { await insert(31, 108, null, true, true, 'archived'); await insert(32, 108); });
  if (native) {
    for (const kind of ['media', 'upload']) {
      await test('concurrent ' + kind + ' publications wait and leave exactly one record', async () => {
        const other = new Client({ connectionString: nativeUrl }); await other.connect();
        const source = kind === 'media' ? 201 : 202, column = kind === 'media' ? 'media_id' : 'upload_session_id';
        try {
          await other.query("set statement_timeout='5s'"); const pid = (await other.query('select pg_backend_pid() pid')).rows[0].pid;
          await q('begin'); await insert(source + 100, kind === 'media' ? source : null, kind === 'upload' ? source : null);
          const pending = other.query(`insert into visual_evidence_records(id,tenant_id,${column},owner_visible,manager_verified,retention_state) values($1,$2,$3,true,true,'active')`, [id(source + 200), id(1), id(source)])
            .then(() => ({ code: 'unexpected_success' }), error => error);
          let locked = false;
          for (let attempt = 0; attempt < 100; attempt++) {
            locked = (await q("select wait_event_type='Lock' locked from pg_stat_activity where pid=$1", [pid])).rows[0]?.locked === true;
            if (locked) break;
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          assert(locked, 'Second publisher must actually block on the uncommitted source key');
          await q('commit'); assert.equal((await pending).code, '23505');
          assert.equal((await q(`select count(*)::int n from visual_evidence_records where tenant_id=$1 and ${column}=$2`, [id(1), id(source)])).rows[0].n, 1);
        } finally { await q('rollback'); await other.end(); }
      });
    }
  }
  console.log(JSON.stringify({ engine: native ? 'native_postgres' : 'pglite', passed: passes.length, live_database_touched: false }));
} finally { await db.close(); }
