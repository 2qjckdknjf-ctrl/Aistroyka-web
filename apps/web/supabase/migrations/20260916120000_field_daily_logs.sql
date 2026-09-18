-- Contractor-ops field daily log (TASK-AISTROYKA-003).
-- Separate from Phase 7 daily digest builders. Status: draft | confirmed.
-- APPLY ON STAGING REQUIRES SASHA / ops — do not auto-deploy from this PR alone.

create table if not exists public.field_daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  work_date date not null,
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  note text,
  summary text,
  work_done text,
  blockers text,
  weather text,
  media_refs jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_field_daily_logs_project on public.field_daily_logs(project_id);
create index if not exists idx_field_daily_logs_tenant on public.field_daily_logs(tenant_id);
create index if not exists idx_field_daily_logs_work_date on public.field_daily_logs(project_id, work_date desc);
create index if not exists idx_field_daily_logs_status on public.field_daily_logs(status) where status = 'draft';

alter table public.field_daily_logs enable row level security;

create policy field_daily_logs_tenant_member on public.field_daily_logs for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create or replace function public.set_field_daily_logs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists field_daily_logs_updated_at on public.field_daily_logs;
create trigger field_daily_logs_updated_at before update on public.field_daily_logs
  for each row execute function public.set_field_daily_logs_updated_at();

comment on table public.field_daily_logs is
  'Contractor field daily log: draft → human confirm. Not manager daily-digest.';
