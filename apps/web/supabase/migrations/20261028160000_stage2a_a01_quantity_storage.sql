-- Stage2a A01: immutable quantity InputSnapshot / WorkSpecification / calculation revisions.
-- Contractor-internal only. No prices, margin, or customer commercial fields.
-- Writers: tenant owner/admin/member via is_internal_tenant_writer_for_tenant.
-- Updates of identity/payload columns are rejected; create a new revision instead.

create table if not exists public.quantity_work_specifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  work_code text not null check (char_length(work_code) between 1 and 100),
  rule_version text not null check (char_length(rule_version) between 1 and 40),
  unit text not null check (unit in ('m2', 'm', 'ea')),
  quantity_basis text not null check (char_length(quantity_basis) between 1 and 64),
  rule_id text not null check (char_length(rule_id) between 1 and 64),
  title text not null check (char_length(title) between 1 and 200),
  revision integer not null check (revision >= 1),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, work_code, revision)
);

create table if not exists public.quantity_input_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  work_specification_id uuid references public.quantity_work_specifications (id) on delete restrict,
  work_code text not null check (char_length(work_code) between 1 and 100),
  rule_version text not null check (char_length(rule_version) between 1 and 40),
  quantity_kind text not null check (char_length(quantity_kind) between 1 and 40),
  request_kind text not null check (request_kind in ('area', 'joint', 'element')),
  request_payload jsonb not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, request_hash)
);

create table if not exists public.quantity_calculation_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  input_snapshot_id uuid not null references public.quantity_input_snapshots (id) on delete cascade,
  revision integer not null check (revision >= 1),
  result_payload jsonb not null,
  quantity text,
  unit text check (unit is null or unit in ('m2', 'm', 'ea')),
  quantity_basis text,
  rule_id text,
  rule_version text not null check (char_length(rule_version) between 1 and 40),
  issues text[] not null default '{}'::text[],
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, input_snapshot_id, revision)
);

create index if not exists quantity_work_specifications_project_idx
  on public.quantity_work_specifications (tenant_id, project_id, work_code, revision desc);

create index if not exists quantity_input_snapshots_project_idx
  on public.quantity_input_snapshots (tenant_id, project_id, created_at desc);

create index if not exists quantity_input_snapshots_spec_idx
  on public.quantity_input_snapshots (tenant_id, project_id, work_specification_id);

create index if not exists quantity_calculation_revisions_snapshot_idx
  on public.quantity_calculation_revisions (tenant_id, project_id, input_snapshot_id, revision desc);

comment on table public.quantity_work_specifications is
  'Stage2a A01 immutable WorkSpecification revisions; catalogue binding without prices.';
comment on table public.quantity_input_snapshots is
  'Stage2a A01 immutable InputSnapshot of a validated QuantityRequest; contractor-internal.';
comment on table public.quantity_calculation_revisions is
  'Stage2a A01 immutable calculation results bound to an InputSnapshot; not customer commercial lines.';

alter table public.quantity_work_specifications enable row level security;
alter table public.quantity_input_snapshots enable row level security;
alter table public.quantity_calculation_revisions enable row level security;

revoke all on table public.quantity_work_specifications from public, anon;
revoke all on table public.quantity_input_snapshots from public, anon;
revoke all on table public.quantity_calculation_revisions from public, anon;

grant select, insert on table public.quantity_work_specifications to authenticated;
grant select, insert on table public.quantity_input_snapshots to authenticated;
grant select, insert on table public.quantity_calculation_revisions to authenticated;

grant all on table public.quantity_work_specifications to service_role;
grant all on table public.quantity_input_snapshots to service_role;
grant all on table public.quantity_calculation_revisions to service_role;

drop policy if exists quantity_work_specifications_select on public.quantity_work_specifications;
create policy quantity_work_specifications_select on public.quantity_work_specifications
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_work_specifications_insert on public.quantity_work_specifications;
create policy quantity_work_specifications_insert on public.quantity_work_specifications
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_input_snapshots_select on public.quantity_input_snapshots;
create policy quantity_input_snapshots_select on public.quantity_input_snapshots
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_input_snapshots_insert on public.quantity_input_snapshots;
create policy quantity_input_snapshots_insert on public.quantity_input_snapshots
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_calculation_revisions_select on public.quantity_calculation_revisions;
create policy quantity_calculation_revisions_select on public.quantity_calculation_revisions
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_calculation_revisions_insert on public.quantity_calculation_revisions;
create policy quantity_calculation_revisions_insert on public.quantity_calculation_revisions
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Immutable identity/payload: reject updates that rewrite stored content.
create or replace function public.enforce_quantity_work_specification_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id
     or new.work_code is distinct from old.work_code
     or new.rule_version is distinct from old.rule_version
     or new.unit is distinct from old.unit
     or new.quantity_basis is distinct from old.quantity_basis
     or new.rule_id is distinct from old.rule_id
     or new.title is distinct from old.title
     or new.revision is distinct from old.revision
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'quantity_work_specifications rows are immutable; create a new revision'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_quantity_input_snapshot_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id
     or new.work_specification_id is distinct from old.work_specification_id
     or new.work_code is distinct from old.work_code
     or new.rule_version is distinct from old.rule_version
     or new.quantity_kind is distinct from old.quantity_kind
     or new.request_kind is distinct from old.request_kind
     or new.request_payload is distinct from old.request_payload
     or new.request_hash is distinct from old.request_hash
     or new.evidence_refs is distinct from old.evidence_refs
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'quantity_input_snapshots rows are immutable; create a new snapshot'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_quantity_calculation_revision_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id
     or new.input_snapshot_id is distinct from old.input_snapshot_id
     or new.revision is distinct from old.revision
     or new.result_payload is distinct from old.result_payload
     or new.quantity is distinct from old.quantity
     or new.unit is distinct from old.unit
     or new.quantity_basis is distinct from old.quantity_basis
     or new.rule_id is distinct from old.rule_id
     or new.rule_version is distinct from old.rule_version
     or new.issues is distinct from old.issues
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'quantity_calculation_revisions rows are immutable; create a new revision'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_quantity_work_specification_immutable() from public;
revoke all on function public.enforce_quantity_input_snapshot_immutable() from public;
revoke all on function public.enforce_quantity_calculation_revision_immutable() from public;
grant execute on function public.enforce_quantity_work_specification_immutable() to authenticated, service_role;
grant execute on function public.enforce_quantity_input_snapshot_immutable() to authenticated, service_role;
grant execute on function public.enforce_quantity_calculation_revision_immutable() to authenticated, service_role;

drop trigger if exists quantity_work_specifications_immutable on public.quantity_work_specifications;
create trigger quantity_work_specifications_immutable
  before update on public.quantity_work_specifications
  for each row execute function public.enforce_quantity_work_specification_immutable();

drop trigger if exists quantity_input_snapshots_immutable on public.quantity_input_snapshots;
create trigger quantity_input_snapshots_immutable
  before update on public.quantity_input_snapshots
  for each row execute function public.enforce_quantity_input_snapshot_immutable();

drop trigger if exists quantity_calculation_revisions_immutable on public.quantity_calculation_revisions;
create trigger quantity_calculation_revisions_immutable
  before update on public.quantity_calculation_revisions
  for each row execute function public.enforce_quantity_calculation_revision_immutable();
