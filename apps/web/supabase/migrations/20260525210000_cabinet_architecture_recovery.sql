-- Cabinet architecture recovery:
-- - persisted onboarding profile
-- - persistent support tickets with threaded replies

create table if not exists public.user_onboarding_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  persona text not null check (persona in ('customer', 'developer', 'contractor', 'supervisor', 'other', 'invited_worker_manager')),
  company_name text,
  company_type text check (company_type in ('customer', 'developer', 'contractor', 'supervisor', 'other')),
  onboarding_completed boolean not null default false,
  tenant_id uuid references public.tenants(id) on delete set null,
  invited_via_token uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_onboarding_profiles_tenant
  on public.user_onboarding_profiles(tenant_id);

alter table public.user_onboarding_profiles enable row level security;

drop policy if exists user_onboarding_profiles_select_own on public.user_onboarding_profiles;
create policy user_onboarding_profiles_select_own
  on public.user_onboarding_profiles
  for select
  using (user_id = auth.uid());

drop policy if exists user_onboarding_profiles_insert_own on public.user_onboarding_profiles;
create policy user_onboarding_profiles_insert_own
  on public.user_onboarding_profiles
  for insert
  with check (user_id = auth.uid());

drop policy if exists user_onboarding_profiles_update_own on public.user_onboarding_profiles;
create policy user_onboarding_profiles_update_own
  on public.user_onboarding_profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.user_onboarding_profiles is
  'Persistent first-start onboarding profile (persona, company intent, completion state).';

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  last_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_requester_created
  on public.support_tickets(requester_user_id, created_at desc);
create index if not exists idx_support_tickets_tenant_created
  on public.support_tickets(tenant_id, created_at desc);
create index if not exists idx_support_tickets_status_updated
  on public.support_tickets(status, updated_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists support_tickets_select_scoped on public.support_tickets;
create policy support_tickets_select_scoped
  on public.support_tickets
  for select
  using (
    requester_user_id = auth.uid()
    or exists (
      select 1
      from public.tenant_members tm
      where tm.tenant_id = support_tickets.tenant_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'admin')
    )
    or exists (
      select 1
      from public.tenants t
      where t.id = support_tickets.tenant_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists support_tickets_insert_own on public.support_tickets;
create policy support_tickets_insert_own
  on public.support_tickets
  for insert
  with check (requester_user_id = auth.uid());

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_type text not null check (author_type in ('user', 'platform_owner')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_ticket_messages_ticket_created
  on public.support_ticket_messages(ticket_id, created_at asc);

alter table public.support_ticket_messages enable row level security;

drop policy if exists support_ticket_messages_select_scoped on public.support_ticket_messages;
create policy support_ticket_messages_select_scoped
  on public.support_ticket_messages
  for select
  using (
    exists (
      select 1
      from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and (
          t.requester_user_id = auth.uid()
          or exists (
            select 1
            from public.tenant_members tm
            where tm.tenant_id = t.tenant_id
              and tm.user_id = auth.uid()
              and tm.role in ('owner', 'admin')
          )
          or exists (
            select 1
            from public.tenants tenant_owner
            where tenant_owner.id = t.tenant_id
              and tenant_owner.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists support_ticket_messages_insert_user on public.support_ticket_messages;
create policy support_ticket_messages_insert_user
  on public.support_ticket_messages
  for insert
  with check (
    author_type = 'user'
    and author_user_id = auth.uid()
    and exists (
      select 1
      from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.requester_user_id = auth.uid()
    )
  );

comment on table public.support_tickets is
  'Persistent support requests initiated by authenticated users.';
comment on table public.support_ticket_messages is
  'Threaded support ticket conversation entries from users and platform owners.';
