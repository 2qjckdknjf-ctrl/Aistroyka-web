-- Plan-fit persistence (Step 4). Selected canonical plan != billing subscription.
-- Additive only; no changes to existing tables.

-- Recommendation records (history/snapshot per workspace).
create table if not exists public.plan_fit_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  input_snapshot jsonb not null default '{}',
  recommended_plan_code text not null,
  alternative_plan_codes jsonb not null default '[]',
  enterprise_signal boolean not null default false,
  reasoning_codes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_plan_fit_recommendations_tenant_created
  on public.plan_fit_recommendations(tenant_id, created_at desc);

comment on table public.plan_fit_recommendations is 'Plan-fit recommendation results (snapshot). Not billing.';

-- Selected canonical plan state per workspace (tenant).
create table if not exists public.workspace_plan_state (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  canonical_plan_code text not null,
  source_kind text not null default 'manual_backend_set',
  selected_by_user_id uuid references auth.users(id) on delete set null,
  selected_at timestamptz not null default now(),
  add_on_codes jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspace_plan_state is 'Selected canonical plan per workspace. Not billing subscription.';
comment on column public.workspace_plan_state.source_kind is 'recommendation_selected | admin_override | imported_legacy | manual_backend_set';

alter table public.plan_fit_recommendations enable row level security;
alter table public.workspace_plan_state enable row level security;

-- Read: tenant members can read.
create policy plan_fit_recommendations_select on public.plan_fit_recommendations for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy workspace_plan_state_select on public.workspace_plan_state for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Insert: tenant members (recommendation submit; plan select).
create policy plan_fit_recommendations_insert on public.plan_fit_recommendations for insert with check (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy workspace_plan_state_insert on public.workspace_plan_state for insert with check (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Update: workspace_plan_state upsert (tenant members).
create policy workspace_plan_state_update on public.workspace_plan_state for update using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
