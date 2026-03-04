-- Worker Lite: day, reports, report media, tasks for mobile workers.
-- RLS: tenant-scoped; workers see own day/reports; tasks by assignment.

create table if not exists public.worker_day (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  day_date date not null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique(tenant_id, user_id, day_date)
);
create index if not exists idx_worker_day_tenant_user_date on public.worker_day(tenant_id, user_id, day_date);

create table if not exists public.worker_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  day_id uuid references public.worker_day(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','submitted')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index if not exists idx_worker_reports_tenant_user on public.worker_reports(tenant_id, user_id);

create table if not exists public.worker_report_media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.worker_reports(id) on delete cascade,
  media_id uuid,
  upload_session_id uuid,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint has_media_or_session check (media_id is not null or upload_session_id is not null)
);
create index if not exists idx_worker_report_media_report on public.worker_report_media(report_id);

create table if not exists public.worker_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_worker_tasks_tenant_assigned_due on public.worker_tasks(tenant_id, assigned_to, due_date);

alter table public.worker_day enable row level security;
alter table public.worker_reports enable row level security;
alter table public.worker_report_media enable row level security;
alter table public.worker_tasks enable row level security;

create policy worker_day_tenant on public.worker_day for all using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()));
create policy worker_reports_tenant on public.worker_reports for all using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()));
create policy worker_report_media_via_report on public.worker_report_media for all using (
  report_id in (select id from public.worker_reports where tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()))
);
create policy worker_tasks_tenant on public.worker_tasks for all using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()));
