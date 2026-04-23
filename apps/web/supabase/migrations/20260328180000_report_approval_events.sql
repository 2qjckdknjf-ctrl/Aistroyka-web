-- Wave 4 Step 2: append-only report approval events (readable by all tenant members).
-- audit_logs SELECT is restricted to owner/admin; workers and managers need a tenant-scoped trail.

create table if not exists public.report_approval_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_id uuid not null references public.worker_reports(id) on delete cascade,
  event_type text not null check (event_type in ('submitted', 'approved', 'rejected', 'changes_requested')),
  actor_user_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_approval_events_report on public.report_approval_events(report_id, created_at);
create index if not exists idx_report_approval_events_tenant on public.report_approval_events(tenant_id, created_at desc);

comment on table public.report_approval_events is 'Append-only workflow log for worker report approvals (Wave 4 Step 2).';

alter table public.report_approval_events enable row level security;

drop policy if exists report_approval_events_select on public.report_approval_events;
create policy report_approval_events_select on public.report_approval_events for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

drop policy if exists report_approval_events_insert on public.report_approval_events;
create policy report_approval_events_insert on public.report_approval_events for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
