-- Customer intake drafts: structured request state, no AI output.

create table if not exists public.customer_intake_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null,
  site_context text,
  location jsonb not null default '{}'::jsonb,
  requested_work_type text,
  budget_range text,
  desired_start date,
  desired_end date,
  media_refs jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_intake_tenant_creator
  on public.customer_intake_drafts (tenant_id, created_by);

alter table public.customer_intake_drafts enable row level security;

drop policy if exists customer_intake_drafts_select on public.customer_intake_drafts;
create policy customer_intake_drafts_select on public.customer_intake_drafts
  for select using (
    created_by = auth.uid()
    or public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

drop policy if exists customer_intake_drafts_insert on public.customer_intake_drafts;
create policy customer_intake_drafts_insert on public.customer_intake_drafts
  for insert with check (
    created_by = auth.uid()
    and (
      tenant_id in (select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid())
      or tenant_id in (select t.id from public.tenants t where t.user_id = auth.uid())
    )
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

drop policy if exists customer_intake_drafts_update on public.customer_intake_drafts;
create policy customer_intake_drafts_update on public.customer_intake_drafts
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid());
