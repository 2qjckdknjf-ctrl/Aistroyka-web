-- Step 13: Project cost items for budget/cost layer.
-- Planned vs actual; optional milestone linkage.

create table if not exists public.project_cost_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null default 'other',
  title text not null,
  planned_amount numeric(14,2) not null check (planned_amount >= 0),
  actual_amount numeric(14,2) not null default 0 check (actual_amount >= 0),
  currency text not null default 'RUB',
  status text not null default 'planned' check (status in ('planned', 'committed', 'incurred', 'approved', 'archived')),
  notes text,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_cost_items_project on public.project_cost_items(project_id);
create index if not exists idx_project_cost_items_tenant on public.project_cost_items(tenant_id);
create index if not exists idx_project_cost_items_milestone on public.project_cost_items(milestone_id) where milestone_id is not null;

alter table public.project_cost_items enable row level security;
create policy project_cost_items_tenant on public.project_cost_items for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create or replace function public.set_project_cost_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger project_cost_items_updated_at before update on public.project_cost_items
  for each row execute function public.set_project_cost_items_updated_at();

comment on table public.project_cost_items is 'Project cost line items: planned vs actual.';
comment on column public.project_cost_items.status is 'planned | committed | incurred | approved | archived';
comment on column public.project_cost_items.category is 'e.g. materials, labor, equipment, other';
