-- Phase 7 closure: minimal explicit project risks for intelligence layer.
-- Distinguishes explicit recorded risks from inferred operational risks.

create table if not exists public.project_risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  severity text not null check (severity in ('low', 'medium', 'high')),
  source text not null default 'explicit' check (source in ('explicit', 'inferred')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_project_risks_project on public.project_risks(project_id);
create index if not exists idx_project_risks_tenant on public.project_risks(tenant_id);

alter table public.project_risks enable row level security;

create policy project_risks_tenant_member on public.project_risks for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

comment on table public.project_risks is 'Explicit project risks for intelligence layer; distinguishes from inferred operational risks.';
