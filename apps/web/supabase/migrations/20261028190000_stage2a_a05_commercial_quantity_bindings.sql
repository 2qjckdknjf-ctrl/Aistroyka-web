-- Stage2a A05: commercial bindings for accepted quantity calculations.
-- Contractor-internal only. Never exposed on portal/customer surfaces.
-- Does not rewrite historical customer estimates; additive binding records only.

create table if not exists public.quantity_commercial_bindings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  acceptance_decision_id uuid not null
    references public.quantity_acceptance_decisions (id) on delete restrict,
  work_spec_hash text not null check (char_length(work_spec_hash) between 1 and 128),
  commercial_policy text not null default 'commercial.stage2a.v1',
  result_payload jsonb not null,
  issues text[] not null default '{}'::text[],
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, acceptance_decision_id)
);

create index if not exists quantity_commercial_bindings_project_idx
  on public.quantity_commercial_bindings (tenant_id, project_id, created_at desc);

comment on table public.quantity_commercial_bindings is
  'Stage2a A05 contractor-internal commercial bind of an accepted quantity; never portal-facing.';

alter table public.quantity_commercial_bindings enable row level security;

revoke all on table public.quantity_commercial_bindings from public, anon;
grant select, insert on table public.quantity_commercial_bindings to authenticated;
grant all on table public.quantity_commercial_bindings to service_role;

drop policy if exists quantity_commercial_bindings_select on public.quantity_commercial_bindings;
create policy quantity_commercial_bindings_select on public.quantity_commercial_bindings
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_commercial_bindings_insert on public.quantity_commercial_bindings;
create policy quantity_commercial_bindings_insert on public.quantity_commercial_bindings
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
