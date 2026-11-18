-- AIS-RULE-015 thin slice: persist trade completeness evaluations.
-- Templates live in application code (approved seed). Evaluations are contractor-internal.
-- Never portal/customer-facing. Completeness is not workmanship certification.

create table if not exists public.construction_completeness_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  template_id text not null check (char_length(template_id) between 1 and 128),
  template_version text not null check (char_length(template_version) between 1 and 32),
  trade text not null check (char_length(trade) between 1 and 64),
  verdict text not null
    check (verdict in ('ABSTAIN', 'INSUFFICIENT_EVIDENCE', 'NEEDS_REVIEW', 'READY_FOR_HUMAN_REVIEW')),
  missing_required_count integer not null check (missing_required_count >= 0),
  missing_recommended_count integer not null check (missing_recommended_count >= 0),
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists construction_completeness_evaluations_project_idx
  on public.construction_completeness_evaluations (tenant_id, project_id, created_at desc);

comment on table public.construction_completeness_evaluations is
  'AIS-RULE-015 trade completeness evaluation runs; contractor-internal; never customer/portal.';

alter table public.construction_completeness_evaluations enable row level security;

revoke all on table public.construction_completeness_evaluations from public, anon;
grant select, insert on table public.construction_completeness_evaluations to authenticated;
grant all on table public.construction_completeness_evaluations to service_role;

drop policy if exists construction_completeness_evaluations_select
  on public.construction_completeness_evaluations;
create policy construction_completeness_evaluations_select
  on public.construction_completeness_evaluations
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists construction_completeness_evaluations_insert
  on public.construction_completeness_evaluations;
create policy construction_completeness_evaluations_insert
  on public.construction_completeness_evaluations
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
