-- Local pilot seed: one tenant, one project. No auth IDs (tenant_members and tasks added by bootstrap after user creation).
-- Run after migrations. Bootstrap script creates auth users then inserts tenant_members and worker_tasks using their UUIDs.

-- Pilot tenant (fixed UUID so bootstrap can reference it)
insert into public.tenants (id, name, plan)
values ('a0000001-0000-4000-8000-000000000001', 'Pilot Local', 'FREE')
on conflict (id) do update set name = excluded.name, plan = excluded.plan;

-- Pilot project
insert into public.projects (id, name, tenant_id)
values (
  'a0000001-0000-4000-8000-000000000002',
  'Pilot Project',
  'a0000001-0000-4000-8000-000000000001'
)
on conflict (id) do update set name = excluded.name, tenant_id = excluded.tenant_id;
