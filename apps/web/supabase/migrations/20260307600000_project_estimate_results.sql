-- Step 15: Project estimate results (cost intelligence foundation).
-- One row per estimate run: image-derived, budget_snapshot, or assumption.
-- No fake exactness; confidence and missing_data explicit.

create table if not exists public.project_estimate_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null check (source_type in ('image', 'budget_snapshot', 'assumption')),
  source_ref jsonb,
  work_categories text[],
  rough_range_min numeric(14,2),
  rough_range_max numeric(14,2),
  currency_hint text,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  missing_data_reasons text[],
  assumption_notes text,
  status text not null default 'generated' check (status in ('draft', 'generated', 'reviewed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_estimate_results_project on public.project_estimate_results(project_id);
create index if not exists idx_project_estimate_results_tenant on public.project_estimate_results(tenant_id);
create index if not exists idx_project_estimate_results_created_at on public.project_estimate_results(project_id, created_at desc);

alter table public.project_estimate_results enable row level security;
create policy project_estimate_results_tenant on public.project_estimate_results for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create or replace function public.set_project_estimate_results_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger project_estimate_results_updated_at before update on public.project_estimate_results
  for each row execute function public.set_project_estimate_results_updated_at();

comment on table public.project_estimate_results is 'Cost intelligence: estimate results from image, budget snapshot, or assumption.';
comment on column public.project_estimate_results.source_type is 'image | budget_snapshot | assumption';
comment on column public.project_estimate_results.source_ref is 'e.g. {"document_id":"..."} or {"media_id":"..."}';
comment on column public.project_estimate_results.confidence is 'low | medium | high';
