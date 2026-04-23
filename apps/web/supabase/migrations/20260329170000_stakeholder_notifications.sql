-- Wave 4 Step 8: stakeholder delivery / notifications (in-app + email audit; not a messaging product).

create table if not exists public.stakeholder_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  kind text not null check (kind in (
    'stakeholder_invite_sent',
    'stakeholder_invite_reminder',
    'client_request_new',
    'client_request_reminder'
  )),
  status text not null default 'pending' check (status in (
    'pending',
    'delivered_in_app',
    'email_sent',
    'email_failed',
    'email_skipped',
    'read'
  )),
  channel text not null default 'both' check (channel in ('in_app', 'email', 'both')),
  payload jsonb not null default '{}',
  stakeholder_invite_id uuid references public.project_stakeholders(id) on delete set null,
  client_request_id uuid references public.project_client_requests(id) on delete set null,
  email_attempted_at timestamptz,
  email_delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stakeholder_notifications_tenant_project
  on public.stakeholder_notifications(tenant_id, project_id, created_at desc);
create index if not exists idx_stakeholder_notifications_recipient
  on public.stakeholder_notifications(tenant_id, recipient_user_id, read_at, created_at desc);
create index if not exists idx_stakeholder_notifications_request
  on public.stakeholder_notifications(client_request_id) where client_request_id is not null;

comment on table public.stakeholder_notifications is
  'Event-driven delivery records for external stakeholders (invite, client requests, reminders).';

alter table public.stakeholder_notifications enable row level security;

-- Recipients read / mark read own rows
create policy stakeholder_notifications_select_own on public.stakeholder_notifications
  for select using (
    recipient_user_id is not null
    and recipient_user_id = (select auth.uid())
  );

create policy stakeholder_notifications_update_read_own on public.stakeholder_notifications
  for update using (
    recipient_user_id is not null
    and recipient_user_id = (select auth.uid())
  ) with check (
    recipient_user_id is not null
    and recipient_user_id = (select auth.uid())
  );

-- Internal readers (managers) — same predicate family as Step 7
create policy stakeholder_notifications_select_internal on public.stakeholder_notifications
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- Inserts from application use service role (bypass RLS). No insert policy for authenticated.
