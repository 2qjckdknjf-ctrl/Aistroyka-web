-- Experiments / A-B (Phase 5.6). Deterministic assignment by hash(user_id).

create table if not exists public.experiments (
  key text primary key,
  description text,
  variants jsonb,
  active boolean not null default false
);

create table if not exists public.experiment_assignments (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  experiment_key text not null references public.experiments(key) on delete cascade,
  variant text not null,
  assigned_at timestamptz not null default now(),
  primary key (tenant_id, user_id, experiment_key)
);

alter table public.experiments enable row level security;
alter table public.experiment_assignments enable row level security;

create policy experiments_read on public.experiments for select to authenticated using (true);
create policy experiment_assignments_own on public.experiment_assignments for select using (
  (tenant_id, user_id) in (select tenant_id, user_id from public.tenant_members where user_id = auth.uid())
  or (tenant_id in (select id from public.tenants where user_id = auth.uid()))
);
