-- Manager notifications inbox: tenant-scoped list with read state and optional target deep link.

create table if not exists public.manager_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  target_type text,
  target_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_manager_notifications_tenant_user_created
  on public.manager_notifications(tenant_id, user_id, created_at desc);
create index if not exists idx_manager_notifications_read_at
  on public.manager_notifications(tenant_id, user_id, read_at) where read_at is null;

alter table public.manager_notifications enable row level security;

create policy manager_notifications_tenant_member on public.manager_notifications
  for all using (
    tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  );

comment on table public.manager_notifications is 'Inbox for manager-facing notifications (report submitted, task assigned, etc.).';
