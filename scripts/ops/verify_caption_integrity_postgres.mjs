import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

assert(process.argv[2], 'Pass the absolute repository path');
const root = process.argv[2] + '/apps/web/supabase/migrations/';
const nativeUrl = process.env.CAPTION_NATIVE_DATABASE_URL;
let Client;
let db;
if (nativeUrl) {
  ({ Client } = await import('pg'));
  const client = new Client({ connectionString: nativeUrl });
  await client.connect();
  db = { query: (sql, params = []) => client.query(sql, params), exec: sql => client.query(sql), close: () => client.end() };
} else {
  db = new PGlite();
}
const query = (sql, params = []) => db.query(sql, params);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let passed = 0;
const test = async (name, run) => { await run(); passed++; console.log('PASS', name); };
const denied = async (run, codes) => {
  await assert.rejects(run, error => codes.includes(error.code), `Expected PostgreSQL denial ${codes}`);
};
const as = async (role, user, run) => {
  await db.exec(`set role ${role}`);
  await query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claim.role',$2,false)", [user ? id(user) : '', role]);
  try { return await run(); } finally { await db.exec('reset role'); }
};
function helper(file, name) {
  const text = readFileSync(root + file, 'utf8');
  const start = text.indexOf('create or replace function public.' + name + '(');
  assert(start >= 0);
  const end = text.indexOf('$$;', text.indexOf('as $$', start));
  return text.slice(start, end + 3);
}

await db.exec(`
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
create schema auth;
create schema app_private;
grant usage on schema auth, public, app_private to anon, authenticated, service_role;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select current_setting('request.jwt.claim.role',true)
$$;
alter default privileges in schema public grant all on tables to authenticated,service_role;
create table auth.users(id uuid primary key);
create table public.accounts(id uuid primary key, status text);
create table public.tenants(id uuid primary key, user_id uuid, account_id uuid);
create table public.tenant_members(tenant_id uuid, user_id uuid, role text);
create table public.projects(id uuid primary key, tenant_id uuid);
create table public.media(id uuid primary key, tenant_id uuid, project_id uuid);
`);
await db.exec(helper('20260906104000_project_write_authorization_hardening.sql', 'is_internal_tenant_writer_for_tenant'));
await db.exec(helper('20260906092000_harden_viewer_project_jobs_estimate_writes.sql', 'is_tenant_owner_or_admin'));
await db.exec(helper('20261003170000_customer_intake_drafts.sql', 'customer_intake_tenant_account_active'));
await db.exec('alter function public.customer_intake_tenant_account_active(uuid) set schema app_private');
await db.exec(readFileSync(root + '20261028220000_ais_mem_016_media_caption_segments.sql', 'utf8'));

for (let user = 1; user <= 7; user++) await query('insert into auth.users values($1)', [id(user)]);
for (const [account, tenant, owner] of [[101, 201, 1], [102, 202, 7]]) {
  await query("insert into accounts values($1,'active')", [id(account)]);
  await query('insert into tenants values($1,$2,$3)', [id(tenant), id(owner), id(account)]);
}
for (const [user, role] of [[2, 'admin'], [3, 'member'], [4, 'viewer'], [5, 'stakeholder'], [6, 'admin']]) {
  await query('insert into tenant_members values($1,$2,$3)', [id(201), id(user), role]);
}
await query("insert into tenant_members values($1,$2,'admin')", [id(202), id(6)]);
for (const [project, tenant] of [[301, 201], [302, 201], [303, 202]]) {
  await query('insert into projects values($1,$2)', [id(project), id(tenant)]);
}
for (const [media, tenant, project] of [[401, 201, 301], [402, 201, 302], [403, 202, 303]]) {
  await query('insert into media values($1,$2,$3)', [id(media), id(tenant), id(project)]);
}
const seedSql = `insert into media_caption_segments
  (tenant_id,project_id,media_id,source_kind,segment_index,text,language,created_by)
  values($1,$2,$3,'transcription',0,$4,$5,$6)`;
const seed = (text, language = 'en') => query(seedSql, [id(201), id(301), id(401), text, language, id(1)]);
const snapshot = async () => (await query('select * from media_caption_segments where media_id=$1 order by source_kind,segment_index', [id(401)])).rows;

// Reproduce the original two-request failure using the real old table constraints.
await seed('Original caption');
await as('authenticated', 3, () => query('delete from media_caption_segments where media_id=$1', [id(401)]));
await as('authenticated', 3, () => denied(() => seed('Bad replacement', 'e'), ['23514']));
assert.equal((await snapshot()).length, 0);
console.log('REPRODUCED legacy delete/insert data loss and member write bypass');
await seed('Original caption');

const migration = readFileSync(root + '20261127170000_media_caption_atomic_replace.sql', 'utf8');
await db.exec(migration);
await db.exec(migration);
const sql = 'select public.replace_media_caption_segments($1,$2,$3,$4,$5,$6::jsonb) as inserted';
const payload = text => [{ text, language: 'en', start_ms: 0, end_ms: 1000, clock_uncertainty: 'exact' }];
const params = (user, segments, overrides = {}) => [
  id(overrides.tenant ?? 201), id(overrides.project ?? 301), id(overrides.media ?? 401),
  id(overrides.actor ?? user), overrides.source ?? 'transcription', JSON.stringify(segments),
];
const replace = (user, segments, overrides) => as('authenticated', user, () => query(sql, params(user, segments, overrides)));

await test('owner replaces complete index and database binds author and ordinals', async () => {
  const segments = [...payload('One'), ...payload('Two')];
  segments[0].created_by = id(7);
  segments[0].project_id = id(303);
  segments[0].segment_index = 77;
  assert.equal((await replace(1, segments)).rows[0].inserted, 2);
  const rows = await snapshot();
  assert.deepEqual(rows.map(r => [r.text, r.segment_index, r.created_by, r.project_id]), [
    ['One', 0, id(1), id(301)], ['Two', 1, id(1), id(301)],
  ]);
});
await test('admin replaces complete index', async () => {
  await replace(2, payload('Admin replacement'));
  assert.deepEqual((await snapshot()).map(r => [r.text, r.created_by]), [['Admin replacement', id(2)]]);
});
for (const user of [3, 4, 5, 7]) {
  await test(`user ${user} cannot replace captions through RPC`, async () => {
    const before = await snapshot();
    await denied(() => replace(user, payload('Unauthorized')), ['42501']);
    assert.deepEqual(await snapshot(), before);
  });
}
for (const user of [1, 2, 3]) {
  await test(`user ${user} cannot bypass atomic replacement with direct writes`, () => as('authenticated', user, async () => {
    await denied(() => seed('Direct'), ['42501']);
    await denied(() => query('delete from media_caption_segments where media_id=$1', [id(401)]), ['42501']);
    await denied(() => query("update media_caption_segments set text='Direct'"), ['42501']);
    await denied(() => query('truncate media_caption_segments'), ['42501']);
  }));
}
await test('forged actor is rejected', () => denied(() => replace(1, payload('Forged'), { actor: 2 }), ['42501']));
for (const overrides of [{ project: 302 }, { media: 402 }, { media: 403 }, { tenant: 202 }, { media: 499 }]) {
  await test(`cross-project/tenant/media scope ${JSON.stringify(overrides)} is rejected before deletion`, async () => {
    const before = await snapshot();
    await denied(() => replace(6, payload('Wrong scope'), overrides), ['P0002']);
    assert.deepEqual(await snapshot(), before);
  });
}
for (const status of ['suspended', 'closed', null]) {
  await test(`account status ${status} cannot replace or read captions`, async () => {
    const before = await snapshot();
    await query('update accounts set status=$1 where id=$2', [status, id(101)]);
    await denied(() => replace(1, payload('Inactive')), ['42501']);
    await as('authenticated', 1, async () => assert.equal((await query('select * from media_caption_segments')).rows.length, 0));
    await query("update accounts set status='active' where id=$1", [id(101)]);
    assert.deepEqual(await snapshot(), before);
  });
}
const invalidPayloads = [
  [{ ...payload('Bad language')[0], language: 'e' }],
  [{ ...payload('Overflow')[0], end_ms: 2147483648 }],
  [{ ...payload('Bad clock')[0], clock_uncertainty: 'invented' }],
  [{ text: '' }],
  [{ text: 'Good first' }, { language: 'en' }],
];
for (const segments of invalidPayloads) {
  await test(`insert failure rolls back deletion: ${JSON.stringify(segments)}`, async () => {
    const before = await snapshot();
    await denied(() => replace(1, segments), ['23514', '22003', '23502']);
    assert.deepEqual(await snapshot(), before);
  });
}
await db.exec(`create function public.test_skip_caption_row() returns trigger language plpgsql as $$
  begin if new.text = 'skip-caption' then return null; end if; return new; end
$$;
create trigger test_skip_caption_row before insert on public.media_caption_segments
for each row execute function public.test_skip_caption_row()`);
await test('authenticated callers cannot add a caption write trigger', () => as('authenticated', 3, () =>
  denied(() => query('create trigger unauthorized_caption_trigger before insert on public.media_caption_segments for each row execute function public.test_skip_caption_row()'), ['42501'])
));
for (const segments of [payload('skip-caption'), [...payload('Partial'), ...payload('skip-caption')]]) {
  await test('a trigger-suppressed insert rolls back the complete replacement', async () => {
    const before = await snapshot();
    await denied(() => replace(1, segments), ['P0001']);
    assert.deepEqual(await snapshot(), before);
  });
}
await db.exec('drop trigger test_skip_caption_row on public.media_caption_segments; drop function public.test_skip_caption_row()');
for (const segments of [[], null, { text: 'not an array' }]) {
  await test('invalid collection is rejected without deleting the index', async () => {
    const before = await snapshot();
    await denied(() => replace(1, segments), ['22023']);
    assert.deepEqual(await snapshot(), before);
  });
}
await test('unknown source is rejected', () => denied(() => replace(1, payload('Bad source'), { source: 'other' }), ['22023']));
await test('anonymous and service callers have no replacement RPC grant', async () => {
  for (const role of ['anon', 'service_role']) {
    await as(role, null, () => denied(() => query(sql, params(1, payload('Unauthorized'))), ['42501']));
  }
});
await test('member keeps legitimate internal search access', () => as('authenticated', 3, async () => {
  assert.equal((await query('select * from media_caption_segments')).rows.length, 1);
}));
await test('legacy mis-scoped rows are hidden and valid replacement repairs them', async () => {
  await query("insert into media_caption_segments(tenant_id,project_id,media_id,source_kind,segment_index,text) values($1,$2,$3,'manual',0,'mis-scoped')", [id(201), id(302), id(401)]);
  await as('authenticated', 1, async () => assert.equal((await query("select * from media_caption_segments where source_kind='manual'")).rows.length, 0));
  await replace(1, payload('Repaired'), { source: 'manual' });
  const rows = (await snapshot()).filter(row => row.source_kind === 'manual');
  assert.deepEqual(rows.map(row => [row.text, row.project_id]), [['Repaired', id(301)]]);
});

if (nativeUrl) {
  await test('concurrent replacements wait on the same media and publish complete sets', async () => {
    const first = new Client({ connectionString: nativeUrl });
    const second = new Client({ connectionString: nativeUrl });
    await first.connect(); await second.connect();
    let secondResult;
    try {
      for (const client of [first, second]) {
        await client.query('set role authenticated');
        await client.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)", [id(1)]);
      }
      await first.query('begin');
      await first.query(sql, params(1, [...payload('First 1'), ...payload('First 2')]));
      const pid = (await second.query('select pg_backend_pid() as pid')).rows[0].pid;
      secondResult = second.query(sql, params(1, payload('Second complete set')));
      // Observe a real PostgreSQL lock wait rather than assuming a timing race.
      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const activity = (await query('select wait_event_type from pg_stat_activity where pid=$1', [pid])).rows[0];
        if (activity?.wait_event_type === 'Lock') { blocked = true; break; }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      assert(blocked, 'Second replacement must wait for the first media lock');
      await first.query('commit');
      await secondResult;
      assert.deepEqual((await snapshot()).filter(r => r.source_kind === 'transcription').map(r => r.text), ['Second complete set']);
    } finally {
      await first.query('rollback');
      await secondResult?.catch(() => {});
      await first.end(); await second.end();
    }
  });
}
await db.close();
console.log(`${passed} caption SQL checks PASS (${nativeUrl ? 'native PostgreSQL' : 'PGlite'})`);
