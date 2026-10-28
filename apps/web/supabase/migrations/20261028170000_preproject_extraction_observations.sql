-- AIS-CLIENT-005A first slice: reviewed preproject extraction runs + observations.
-- Contractor-internal only in this slice (portal projection is a follow-up).
-- No prices, margin, or contractor cost fields. Human review required; no auto-promote.

create table if not exists public.preproject_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  intake_draft_id uuid references public.customer_intake_drafts (id) on delete set null,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'partially_reviewed', 'reviewed', 'failed', 'cancelled')),
  source_kind text not null default 'text_heuristic'
    check (source_kind in ('text_heuristic', 'photo_async', 'manual_seed')),
  source_ref text,
  provider_meta jsonb not null default '{}'::jsonb,
  error_code text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preproject_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  run_id uuid not null references public.preproject_extraction_runs (id) on delete cascade,
  kind text not null check (kind in ('room', 'zone', 'work_item', 'note')),
  label text not null check (char_length(label) between 1 and 200),
  payload jsonb not null default '{}'::jsonb,
  uncertainty text not null default 'medium'
    check (uncertainty in ('low', 'medium', 'high', 'unknown')),
  source_coords jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'accepted', 'rejected', 'edited')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists preproject_extraction_runs_tenant_idx
  on public.preproject_extraction_runs (tenant_id, created_at desc);

create index if not exists preproject_extraction_runs_draft_idx
  on public.preproject_extraction_runs (tenant_id, intake_draft_id);

create index if not exists preproject_observations_run_idx
  on public.preproject_observations (tenant_id, run_id, review_status);

comment on table public.preproject_extraction_runs is
  'AIS-CLIENT-005A extraction run; observations require human review before any promote.';
comment on table public.preproject_observations is
  'Reviewed preproject suggestions (room/zone/work/note); never auto-estimate or assign.';

alter table public.preproject_extraction_runs enable row level security;
alter table public.preproject_observations enable row level security;

revoke all on table public.preproject_extraction_runs from public, anon;
revoke all on table public.preproject_observations from public, anon;

grant select, insert, update on table public.preproject_extraction_runs to authenticated;
grant select, insert, update on table public.preproject_observations to authenticated;

grant all on table public.preproject_extraction_runs to service_role;
grant all on table public.preproject_observations to service_role;

drop policy if exists preproject_extraction_runs_select on public.preproject_extraction_runs;
create policy preproject_extraction_runs_select on public.preproject_extraction_runs
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists preproject_extraction_runs_insert on public.preproject_extraction_runs;
create policy preproject_extraction_runs_insert on public.preproject_extraction_runs
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists preproject_extraction_runs_update on public.preproject_extraction_runs;
create policy preproject_extraction_runs_update on public.preproject_extraction_runs
  for update
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists preproject_observations_select on public.preproject_observations;
create policy preproject_observations_select on public.preproject_observations
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists preproject_observations_insert on public.preproject_observations;
create policy preproject_observations_insert on public.preproject_observations
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists preproject_observations_update on public.preproject_observations;
create policy preproject_observations_update on public.preproject_observations
  for update
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
